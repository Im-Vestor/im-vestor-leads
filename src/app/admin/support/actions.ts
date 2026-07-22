"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getOrCreateSupportUser } from "@/lib/support";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const MESSAGE_MAX_LENGTH = 4000;

export type SupportThread = {
	id: string;
	updatedAt: Date;
	user: {
		id: string;
		name: string | null;
		email: string;
		role: string;
		lastSeenAt: Date | null;
	} | null;
	lastMessage: {
		id: string;
		content: string;
		createdAt: Date;
		senderId: string;
	} | null;
	unreadCount: number;
};

export type SupportMessage = {
	id: string;
	content: string;
	createdAt: Date;
	readAt: Date | null;
	senderId: string;
};

async function assertSupportThread(conversationId: string, supportId: string) {
	const conversation = await prisma.conversation.findFirst({
		where: { id: conversationId, participants: { some: { id: supportId } } },
		select: { id: true },
	});
	return !!conversation;
}

export async function getSupportUnreadCount(): Promise<
	ActionResult<{ count: number; supportUserId: string }>
> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const support = await getOrCreateSupportUser();
	const count = await prisma.message.count({
		where: {
			NOT: { senderId: support.id },
			readAt: null,
			conversation: { participants: { some: { id: support.id } } },
		},
	});

	return { ok: true, data: { count, supportUserId: support.id } };
}

export async function listSupportConversations(): Promise<
	ActionResult<{ items: SupportThread[]; supportUserId: string }>
> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const support = await getOrCreateSupportUser();

	const rows = await prisma.conversation.findMany({
		where: { participants: { some: { id: support.id } } },
		orderBy: { updatedAt: "desc" },
		include: {
			participants: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					lastSeenAt: true,
				},
			},
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				select: { id: true, content: true, createdAt: true, senderId: true },
			},
		},
	});

	const unreadCounts = await prisma.message.groupBy({
		by: ["conversationId"],
		where: {
			conversationId: { in: rows.map((r) => r.id) },
			NOT: { senderId: support.id },
			readAt: null,
		},
		_count: { _all: true },
	});
	const unreadByConv = new Map(
		unreadCounts.map((u) => [u.conversationId, u._count._all]),
	);

	const items: SupportThread[] = rows.map((row) => ({
		id: row.id,
		updatedAt: row.updatedAt,
		user: row.participants.find((p) => p.id !== support.id) ?? null,
		lastMessage: row.messages[0] ?? null,
		unreadCount: unreadByConv.get(row.id) ?? 0,
	}));

	return { ok: true, data: { items, supportUserId: support.id } };
}

const idSchema = z.object({ conversationId: z.string().min(1) });

export async function getSupportMessages(
	input: z.input<typeof idSchema>,
): Promise<ActionResult<SupportMessage[]>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const support = await getOrCreateSupportUser();
	if (!(await assertSupportThread(parsed.data.conversationId, support.id))) {
		return { ok: false, error: t("errForbidden") };
	}

	const rows = await prisma.message.findMany({
		where: { conversationId: parsed.data.conversationId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			content: true,
			createdAt: true,
			readAt: true,
			senderId: true,
		},
	});

	return { ok: true, data: rows };
}

const replySchema = z.object({
	conversationId: z.string().min(1),
	content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});

export async function replyAsSupport(
	input: z.input<typeof replySchema>,
): Promise<ActionResult<SupportMessage>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = replySchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidMessage") };

	const support = await getOrCreateSupportUser();

	const conversation = await prisma.conversation.findFirst({
		where: {
			id: parsed.data.conversationId,
			participants: { some: { id: support.id } },
		},
		include: { participants: { select: { id: true } } },
	});
	if (!conversation) return { ok: false, error: t("errForbidden") };

	const preview =
		parsed.data.content.length > 100
			? `${parsed.data.content.slice(0, 100)}…`
			: parsed.data.content;

	const recipients = conversation.participants
		.map((p) => p.id)
		.filter((id) => id !== support.id);

	const [message] = await prisma.$transaction([
		prisma.message.create({
			data: {
				content: parsed.data.content,
				senderId: support.id,
				conversationId: conversation.id,
			},
			select: {
				id: true,
				content: true,
				createdAt: true,
				readAt: true,
				senderId: true,
			},
		}),
		prisma.conversation.update({
			where: { id: conversation.id },
			data: { updatedAt: new Date() },
		}),
		...(recipients.length > 0
			? [
					prisma.notification.createMany({
						data: recipients.map((userId) => ({
							userId,
							senderId: support.id,
							type: "MESSAGE_RECEIVED" as const,
							message: preview,
						})),
					}),
				]
			: []),
	]);

	return { ok: true, data: message };
}

export async function markSupportRead(
	input: z.input<typeof idSchema>,
): Promise<ActionResult<{ count: number }>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const support = await getOrCreateSupportUser();
	if (!(await assertSupportThread(parsed.data.conversationId, support.id))) {
		return { ok: false, error: t("errForbidden") };
	}

	const result = await prisma.message.updateMany({
		where: {
			conversationId: parsed.data.conversationId,
			NOT: { senderId: support.id },
			readAt: null,
		},
		data: { readAt: new Date() },
	});

	return { ok: true, data: { count: result.count } };
}
