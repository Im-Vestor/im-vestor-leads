"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { findBannedWord } from "@/lib/messages/banned-words";
import { canMessageDirectly } from "@/lib/messages/contact";
import { findOrCreateDirectConversation } from "@/lib/messages/conversation";
import { getDisplayName } from "@/lib/messages/display-name";
import { notifyPokeAnswered, notifyPokeReceived } from "@/lib/notify";
import { POKE_MESSAGE_MAX_LENGTH, pokeExpiryFrom } from "@/lib/pokes";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Thrown inside the send transaction so a failed spend rolls the poke back. */
const NO_POKES = "NO_POKES";
/** Postgres unique violation — here, always `pokes_pending_unique`. */
const UNIQUE_VIOLATION = "P2002";

async function requireMe() {
	const { userId: clerkId } = await auth();
	if (!clerkId) return null;
	return prisma.user.findUnique({
		where: { clerkId },
		select: { id: true, name: true, email: true },
	});
}

const sendSchema = z
	.object({
		targetUserId: z.string().min(1).optional(),
		projectId: z.string().min(1).optional(),
		message: z.string().trim().max(POKE_MESSAGE_MAX_LENGTH).default(""),
	})
	// One or the other: a poke aimed at a project still lands on its founder.
	.refine((v) => Boolean(v.targetUserId) !== Boolean(v.projectId));

/**
 * Spends one poke to ask another member for contact. The request starts
 * PENDING and buys nothing on its own — only the receiver accepting it opens a
 * conversation.
 */
export async function sendPoke(
	input: z.input<typeof sendSchema>,
): Promise<ActionResult<{ pokeId: string }>> {
	const t = await getT();
	const parsed = sendSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const me = await requireMe();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	let receiverId = parsed.data.targetUserId ?? null;
	if (parsed.data.projectId) {
		const project = await prisma.project.findUnique({
			where: { id: parsed.data.projectId },
			select: { entrepreneurId: true, status: true },
		});
		if (project?.status !== "PUBLISHED") {
			return { ok: false, error: t("errProjectNotFound") };
		}
		receiverId = project.entrepreneurId;
	}
	if (!receiverId) return { ok: false, error: t("errRecipientNotFound") };

	if (receiverId === me.id)
		return { ok: false, error: t("errCannotPokeYourself") };

	const receiver = await prisma.user.findUnique({
		where: { id: receiverId },
		select: { id: true },
	});
	if (!receiver) return { ok: false, error: t("errRecipientNotFound") };

	const message = parsed.data.message;
	if (message) {
		const banned = await findBannedWord(message);
		if (banned) return { ok: false, error: t("errBannedContent") };
	}

	// The door is already open — an accepted poke either way, or a thread they
	// already share. Spending another poke would buy nothing.
	if (await canMessageDirectly(me.id, receiver.id)) {
		return { ok: false, error: t("errPokeAlreadyAccepted") };
	}

	const now = new Date();

	try {
		const pokeId = await prisma.$transaction(async (tx) => {
			// Spend first: the guard on the balance is the same statement that
			// decrements it, so two clicks cannot both get through on one poke.
			const spent = await tx.user.updateMany({
				where: { id: me.id, pokes: { gt: 0 } },
				data: { pokes: { decrement: 1 } },
			});
			if (spent.count === 0) throw new Error(NO_POKES);

			const poke = await tx.poke.create({
				data: {
					senderId: me.id,
					receiverId: receiver.id,
					message,
					expiresAt: pokeExpiryFrom(now),
				},
				select: { id: true },
			});

			// No link: the row is answered in place from the bell.
			await tx.notification.create({
				data: {
					userId: receiver.id,
					senderId: me.id,
					type: "POKE_RECEIVED",
					message: message || null,
					pokeId: poke.id,
				},
			});

			return poke.id;
		});

		notifyPokeReceived({ pokeId });

		revalidatePath("/dashboard");
		return { ok: true, data: { pokeId } };
	} catch (err) {
		if (err instanceof Error && err.message === NO_POKES) {
			return { ok: false, error: t("errNoPokes") };
		}
		if ((err as { code?: string })?.code === UNIQUE_VIOLATION) {
			return { ok: false, error: t("errPokeAlreadyPending") };
		}
		return { ok: false, error: t("errCouldNotSendPoke") };
	}
}

const respondSchema = z.object({
	pokeId: z.string().min(1),
	action: z.enum(["accept", "reject"]),
});

export type PokeResponseResult = {
	status: "ACCEPTED" | "REJECTED";
	/** Set only on accept — where the two can now talk. */
	conversationId: string | null;
};

/**
 * The receiver's answer. Accepting opens the conversation; rejecting hands the
 * poke back to the sender, so nobody pays for a door that stayed shut.
 */
export async function respondToPoke(
	input: z.input<typeof respondSchema>,
): Promise<ActionResult<PokeResponseResult>> {
	const t = await getT();
	const parsed = respondSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const me = await requireMe();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	const poke = await prisma.poke.findUnique({
		where: { id: parsed.data.pokeId },
		select: { id: true, senderId: true, receiverId: true, status: true },
	});
	if (!poke) return { ok: false, error: t("errPokeNotFound") };
	// Only the person being asked gets to answer.
	if (poke.receiverId !== me.id) return { ok: false, error: t("errForbidden") };
	if (poke.status !== "PENDING") {
		return { ok: false, error: t("errPokeAlreadyAnswered") };
	}

	const accept = parsed.data.action === "accept";
	const status = accept ? "ACCEPTED" : "REJECTED";
	const receiverName = getDisplayName(me);

	try {
		const conversationId = await prisma.$transaction(async (tx) => {
			// The status guard lives in the WHERE clause: a second click finds
			// nothing to update and leaves the first answer standing.
			const answered = await tx.poke.updateMany({
				where: { id: poke.id, receiverId: me.id, status: "PENDING" },
				data: { status, respondedAt: new Date() },
			});
			if (answered.count === 0) throw new Error("ALREADY_ANSWERED");

			// A rejected introduction costs the sender nothing.
			if (!accept) {
				await tx.user.update({
					where: { id: poke.senderId },
					data: { pokes: { increment: 1 } },
				});
			}

			const conversation = accept
				? await findOrCreateDirectConversation(poke.senderId, me.id, tx)
				: null;

			// Answering *is* reading it. Without this the row stays unread and the
			// bell keeps a badge for a request that is already settled.
			await tx.notification.updateMany({
				where: { pokeId: poke.id, userId: me.id, read: false },
				data: { read: true },
			});

			await tx.notification.create({
				data: {
					userId: poke.senderId,
					senderId: me.id,
					type: accept ? "POKE_ACCEPTED" : "POKE_REJECTED",
					message: receiverName,
					link: conversation ? `/messages?c=${conversation}` : null,
					pokeId: poke.id,
				},
			});

			return conversation;
		});

		notifyPokeAnswered({ pokeId: poke.id, accepted: accept, conversationId });

		revalidatePath("/dashboard");
		revalidatePath("/messages");
		return { ok: true, data: { status, conversationId } };
	} catch (err) {
		if (err instanceof Error && err.message === "ALREADY_ANSWERED") {
			return { ok: false, error: t("errPokeAlreadyAnswered") };
		}
		return { ok: false, error: t("errCouldNotAnswerPoke") };
	}
}
