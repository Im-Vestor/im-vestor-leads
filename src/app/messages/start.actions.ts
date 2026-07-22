"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateSupportUser } from "@/lib/support";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Finds the existing 1:1 conversation between two users, or creates it. */
async function findOrCreateDirectConversation(aId: string, bId: string) {
	return prisma.$transaction(async (tx) => {
		const existing = await tx.conversation.findFirst({
			where: {
				AND: [
					{ participants: { some: { id: aId } } },
					{ participants: { some: { id: bId } } },
				],
			},
			select: { id: true, participants: { select: { id: true } } },
		});
		if (existing && existing.participants.length === 2) return existing.id;

		const created = await tx.conversation.create({
			data: { participants: { connect: [{ id: aId }, { id: bId }] } },
			select: { id: true },
		});
		return created.id;
	});
}

const startSchema = z.object({
	targetUserId: z.string().min(1),
});

export async function startConversationFromProfile(
	input: z.input<typeof startSchema>,
): Promise<ActionResult<{ conversationId: string }>> {
	const t = await getT();
	const parsed = startSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: t("errNotAuthenticated") };

	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true },
	});
	if (!me) return { ok: false, error: t("errUserNotFound") };

	if (me.id === parsed.data.targetUserId) {
		return { ok: false, error: t("errCannotMessageYourself") };
	}

	const target = await prisma.user.findUnique({
		where: { id: parsed.data.targetUserId },
		select: { id: true },
	});
	if (!target) return { ok: false, error: t("errRecipientNotFound") };

	const conversationId = await findOrCreateDirectConversation(me.id, target.id);

	return { ok: true, data: { conversationId } };
}

const leadSchema = z.object({ projectId: z.string().min(1) });

/** An investor who unlocked a project's lead opens a chat with its founder. */
export async function startConversationForLead(
	input: z.input<typeof leadSchema>,
): Promise<ActionResult<{ conversationId: string }>> {
	const t = await getT();
	const parsed = leadSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: t("errNotAuthenticated") };

	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true },
	});
	if (!me) return { ok: false, error: t("errUserNotFound") };

	const project = await prisma.project.findUnique({
		where: { id: parsed.data.projectId },
		select: { entrepreneurId: true },
	});
	if (!project) return { ok: false, error: t("errProjectNotFound") };

	if (me.id === project.entrepreneurId) {
		return { ok: false, error: t("errCannotMessageYourself") };
	}

	const unlocked = await prisma.projectUnlock.findUnique({
		where: {
			userId_projectId: { userId: me.id, projectId: parsed.data.projectId },
		},
		select: { id: true },
	});
	if (!unlocked) {
		return { ok: false, error: t("errUnlockLeadFirst") };
	}

	const conversationId = await findOrCreateDirectConversation(
		me.id,
		project.entrepreneurId,
	);

	return { ok: true, data: { conversationId } };
}

/** Opens (or creates) the current user's conversation with Im-Vestor Support. */
export async function startSupportConversation(): Promise<
	ActionResult<{ conversationId: string }>
> {
	const t = await getT();
	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: t("errNotAuthenticated") };

	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true },
	});
	if (!me) return { ok: false, error: t("errUserNotFound") };

	const support = await getOrCreateSupportUser();
	if (me.id === support.id) {
		return { ok: false, error: t("errSupportCannotMessageItself") };
	}

	const conversationId = await findOrCreateDirectConversation(
		me.id,
		support.id,
	);

	return { ok: true, data: { conversationId } };
}
