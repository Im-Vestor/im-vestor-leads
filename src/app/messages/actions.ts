"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { findBannedWord } from "@/lib/messages/banned-words";
import { prisma } from "@/lib/prisma";
import { SUPPORT_EMAIL } from "@/lib/support";

const MESSAGE_MAX_LENGTH = 4000;
const PAGE_SIZE = 50;

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireUser() {
	const { userId: clerkId } = await auth();
	if (!clerkId) return null;
	return prisma.user.findUnique({
		where: { clerkId },
		select: { id: true, role: true },
	});
}

async function assertParticipant(conversationId: string, userId: string) {
	const conversation = await prisma.conversation.findFirst({
		where: { id: conversationId, participants: { some: { id: userId } } },
		select: { id: true },
	});
	return !!conversation;
}

export type ConversationListItem = {
	id: string;
	updatedAt: Date;
	other: {
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
	isSupport: boolean;
};

export async function getConversations(): Promise<
	ActionResult<ConversationListItem[]>
> {
	const me = await requireUser();
	if (!me) return { ok: false, error: "Not authenticated" };

	const rows = await prisma.conversation.findMany({
		where: { participants: { some: { id: me.id } } },
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
				select: {
					id: true,
					content: true,
					createdAt: true,
					senderId: true,
				},
			},
		},
	});

	const unreadCounts = await prisma.message.groupBy({
		by: ["conversationId"],
		where: {
			conversationId: { in: rows.map((r) => r.id) },
			NOT: { senderId: me.id },
			readAt: null,
		},
		_count: { _all: true },
	});
	const unreadByConv = new Map(
		unreadCounts.map((u) => [u.conversationId, u._count._all]),
	);

	const data: ConversationListItem[] = rows.map((row) => {
		const other = row.participants.find((p) => p.id !== me.id) ?? null;
		return {
			id: row.id,
			updatedAt: row.updatedAt,
			other,
			lastMessage: row.messages[0] ?? null,
			unreadCount: unreadByConv.get(row.id) ?? 0,
			isSupport: other?.email === SUPPORT_EMAIL,
		};
	});

	return { ok: true, data };
}

export type MessageItem = {
	id: string;
	content: string;
	createdAt: Date;
	readAt: Date | null;
	senderId: string;
};

const getMessagesSchema = z.object({
	conversationId: z.string().min(1),
	cursor: z.string().optional(),
});

export async function getMessages(
	input: z.input<typeof getMessagesSchema>,
): Promise<
	ActionResult<{ messages: MessageItem[]; nextCursor: string | null }>
> {
	const parsed = getMessagesSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Invalid input" };

	const me = await requireUser();
	if (!me) return { ok: false, error: "Not authenticated" };

	if (!(await assertParticipant(parsed.data.conversationId, me.id))) {
		return { ok: false, error: "Forbidden" };
	}

	const rows = await prisma.message.findMany({
		where: { conversationId: parsed.data.conversationId },
		orderBy: { createdAt: "desc" },
		take: PAGE_SIZE + 1,
		...(parsed.data.cursor
			? { cursor: { id: parsed.data.cursor }, skip: 1 }
			: {}),
		select: {
			id: true,
			content: true,
			createdAt: true,
			readAt: true,
			senderId: true,
		},
	});

	let nextCursor: string | null = null;
	if (rows.length > PAGE_SIZE) {
		const last = rows.pop();
		nextCursor = last?.id ?? null;
	}

	return {
		ok: true,
		data: { messages: rows.reverse(), nextCursor },
	};
}

const sendMessageSchema = z.object({
	conversationId: z.string().min(1),
	content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});

export async function sendMessage(
	input: z.input<typeof sendMessageSchema>,
): Promise<ActionResult<MessageItem>> {
	const parsed = sendMessageSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Invalid message" };

	const me = await requireUser();
	if (!me) return { ok: false, error: "Not authenticated" };

	const conversation = await prisma.conversation.findFirst({
		where: {
			id: parsed.data.conversationId,
			participants: { some: { id: me.id } },
		},
		include: { participants: { select: { id: true } } },
	});
	if (!conversation) return { ok: false, error: "Forbidden" };

	const banned = await findBannedWord(parsed.data.content);
	if (banned)
		return { ok: false, error: "Your message contains banned content" };

	const preview =
		parsed.data.content.length > 100
			? `${parsed.data.content.slice(0, 100)}…`
			: parsed.data.content;

	const recipients = conversation.participants
		.map((p) => p.id)
		.filter((id) => id !== me.id);

	const [message] = await prisma.$transaction([
		prisma.message.create({
			data: {
				content: parsed.data.content,
				senderId: me.id,
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
							senderId: me.id,
							type: "MESSAGE_RECEIVED" as const,
							message: preview,
						})),
					}),
				]
			: []),
	]);

	return { ok: true, data: message };
}

const markAsReadSchema = z.object({
	conversationId: z.string().min(1),
});

export async function markAsRead(
	input: z.input<typeof markAsReadSchema>,
): Promise<ActionResult<{ count: number }>> {
	const parsed = markAsReadSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Invalid input" };

	const me = await requireUser();
	if (!me) return { ok: false, error: "Not authenticated" };

	if (!(await assertParticipant(parsed.data.conversationId, me.id))) {
		return { ok: false, error: "Forbidden" };
	}

	const result = await prisma.message.updateMany({
		where: {
			conversationId: parsed.data.conversationId,
			NOT: { senderId: me.id },
			readAt: null,
		},
		data: { readAt: new Date() },
	});

	return { ok: true, data: { count: result.count } };
}

export async function getUnreadMessageCount(): Promise<ActionResult<number>> {
	const me = await requireUser();
	if (!me) return { ok: false, error: "Not authenticated" };

	const count = await prisma.message.count({
		where: {
			NOT: { senderId: me.id },
			readAt: null,
			conversation: { participants: { some: { id: me.id } } },
		},
	});

	return { ok: true, data: count };
}
