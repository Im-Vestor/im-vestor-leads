"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { canMessageDirectly } from "@/lib/messages/contact";
import { findOrCreateDirectConversation } from "@/lib/messages/conversation";
import { prisma } from "@/lib/prisma";
import { getOrCreateSupportUser } from "@/lib/support";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

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
		select: { id: true, role: true },
	});
	if (!me) return { ok: false, error: t("errUserNotFound") };

	if (me.id === parsed.data.targetUserId) {
		return { ok: false, error: t("errCannotMessageYourself") };
	}

	const target = await prisma.user.findUnique({
		where: { id: parsed.data.targetUserId },
		select: { id: true, role: true },
	});
	if (!target) return { ok: false, error: t("errRecipientNotFound") };

	// Staff and support are reachable without spending anything. Between
	// members, a profile alone is not enough: one side has to have accepted the
	// other's poke before the thread can exist.
	const staff = me.role === "ADMIN" || target.role === "ADMIN";
	if (!staff && !(await canMessageDirectly(me.id, target.id))) {
		return { ok: false, error: t("errPokeAcceptanceRequired") };
	}

	const conversationId = await findOrCreateDirectConversation(me.id, target.id);

	return { ok: true, data: { conversationId } };
}

const leadSchema = z.object({ projectId: z.string().min(1) });

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
		select: { entrepreneurId: true, hypertrainUntil: true },
	});
	if (!project) return { ok: false, error: t("errProjectNotFound") };

	if (me.id === project.entrepreneurId) {
		return { ok: false, error: t("errCannotMessageYourself") };
	}

	// During the hypertrain window the chat is open to every investor; otherwise
	// the lead must have been unlocked first.
	const onHypertrain =
		project.hypertrainUntil !== null && project.hypertrainUntil > new Date();
	if (!onHypertrain) {
		const unlocked = await prisma.projectUnlock.findUnique({
			where: {
				userId_projectId: { userId: me.id, projectId: parsed.data.projectId },
			},
			select: { id: true },
		});
		if (!unlocked) {
			return { ok: false, error: t("errUnlockLeadFirst") };
		}
	}

	const conversationId = await findOrCreateDirectConversation(
		me.id,
		project.entrepreneurId,
	);

	// Tag this thread as a lead/hypertrain chat so it locks once the window ends.
	// Stamp only when unset, to avoid re-tagging a pre-existing free chat's project.
	await prisma.conversation.updateMany({
		where: { id: conversationId, projectId: null },
		data: { projectId: parsed.data.projectId },
	});

	return { ok: true, data: { conversationId } };
}

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
