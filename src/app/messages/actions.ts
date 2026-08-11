"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { findBannedWord } from "@/lib/messages/banned-words";
import { isConversationLocked } from "@/lib/messages/conversation-access";
import { notifyNewMessage } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { SUPPORT_EMAIL } from "@/lib/support";
import { getT } from "@/utils/translations/server";

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

// Participant check + post-hypertrain lock for a single conversation.
// `found` is false when the viewer is not a participant (or it doesn't exist).
async function conversationAccess(
	conversationId: string,
	viewerId: string,
): Promise<{ found: boolean; locked: boolean }> {
	const convo = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: {
			projectId: true,
			project: { select: { hypertrainUntil: true, entrepreneurId: true } },
			participants: { select: { id: true } },
		},
	});
	if (!convo?.participants.some((p) => p.id === viewerId)) {
		return { found: false, locked: false };
	}
	if (!convo.projectId || !convo.project) return { found: true, locked: false };

	const viewerIsEntrepreneur = convo.project.entrepreneurId === viewerId;
	let viewerPaid: boolean;
	if (viewerIsEntrepreneur) {
		const otherId = convo.participants.find((p) => p.id !== viewerId)?.id;
		viewerPaid = otherId
			? !!(await prisma.investorUnlock.findUnique({
					where: {
						entrepreneurId_investorId: {
							entrepreneurId: viewerId,
							investorId: otherId,
						},
					},
					select: { id: true },
				}))
			: false;
	} else {
		viewerPaid = !!(await prisma.projectUnlock.findUnique({
			where: {
				userId_projectId: { userId: viewerId, projectId: convo.projectId },
			},
			select: { id: true },
		}));
	}

	return {
		found: true,
		locked: isConversationLocked({
			projectId: convo.projectId,
			hypertrainUntil: convo.project.hypertrainUntil,
			viewerPaid,
			now: new Date(),
		}),
	};
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
	locked: boolean;
	projectId: string | null;
};

export async function getConversations(): Promise<
	ActionResult<ConversationListItem[]>
> {
	const t = await getT();
	const me = await requireUser();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	const rows = await prisma.conversation.findMany({
		where: { participants: { some: { id: me.id } } },
		orderBy: { updatedAt: "desc" },
		include: {
			project: { select: { hypertrainUntil: true, entrepreneurId: true } },
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

	// Post-hypertrain lock (see conversation-access). For each lead chat, this
	// viewer's own unlock decides visibility: project unlock when they are the
	// investor, investor unlock when they are the entrepreneur.
	const projectIdsAsInvestor: string[] = [];
	const investorIdsAsEntrepreneur: string[] = [];
	for (const row of rows) {
		if (!row.projectId || !row.project) continue;
		const other = row.participants.find((p) => p.id !== me.id) ?? null;
		if (row.project.entrepreneurId === me.id) {
			if (other) investorIdsAsEntrepreneur.push(other.id);
		} else {
			projectIdsAsInvestor.push(row.projectId);
		}
	}
	const [projectUnlocks, investorUnlocks] = await Promise.all([
		projectIdsAsInvestor.length
			? prisma.projectUnlock.findMany({
					where: { userId: me.id, projectId: { in: projectIdsAsInvestor } },
					select: { projectId: true },
				})
			: Promise.resolve([]),
		investorIdsAsEntrepreneur.length
			? prisma.investorUnlock.findMany({
					where: {
						entrepreneurId: me.id,
						investorId: { in: investorIdsAsEntrepreneur },
					},
					select: { investorId: true },
				})
			: Promise.resolve([]),
	]);
	const unlockedProjectIds = new Set(projectUnlocks.map((u) => u.projectId));
	const unlockedInvestorIds = new Set(investorUnlocks.map((u) => u.investorId));
	const now = new Date();

	const data: ConversationListItem[] = rows.map((row) => {
		const other = row.participants.find((p) => p.id !== me.id) ?? null;
		const viewerPaid =
			row.projectId && row.project
				? row.project.entrepreneurId === me.id
					? !!other && unlockedInvestorIds.has(other.id)
					: unlockedProjectIds.has(row.projectId)
				: false;
		const locked = isConversationLocked({
			projectId: row.projectId,
			hypertrainUntil: row.project?.hypertrainUntil ?? null,
			viewerPaid,
			now,
		});
		return {
			id: row.id,
			updatedAt: row.updatedAt,
			other,
			// Don't leak preview/unread of hidden messages into the list.
			lastMessage: locked ? null : (row.messages[0] ?? null),
			unreadCount: locked ? 0 : (unreadByConv.get(row.id) ?? 0),
			isSupport: other?.email === SUPPORT_EMAIL,
			projectId: row.projectId,
			locked,
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
	const t = await getT();
	const parsed = getMessagesSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const me = await requireUser();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	const access = await conversationAccess(parsed.data.conversationId, me.id);
	if (!access.found) return { ok: false, error: t("errForbidden") };
	if (access.locked) return { ok: false, error: t("errChatLocked") };

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
	const t = await getT();
	const parsed = sendMessageSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidMessage") };

	const me = await requireUser();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	const access = await conversationAccess(parsed.data.conversationId, me.id);
	if (!access.found) return { ok: false, error: t("errForbidden") };
	if (access.locked) return { ok: false, error: t("errChatLocked") };

	const conversation = await prisma.conversation.findFirst({
		where: {
			id: parsed.data.conversationId,
			participants: { some: { id: me.id } },
		},
		include: { participants: { select: { id: true } } },
	});
	if (!conversation) return { ok: false, error: t("errForbidden") };

	const banned = await findBannedWord(parsed.data.content);
	if (banned) return { ok: false, error: t("errBannedContent") };

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
							link: "/messages",
						})),
					}),
				]
			: []),
	]);

	notifyNewMessage({
		conversationId: conversation.id,
		messageId: message.id,
		senderId: me.id,
		recipientIds: recipients,
		preview,
	});

	return { ok: true, data: message };
}

const markAsReadSchema = z.object({
	conversationId: z.string().min(1),
});

export async function markAsRead(
	input: z.input<typeof markAsReadSchema>,
): Promise<ActionResult<{ count: number }>> {
	const t = await getT();
	const parsed = markAsReadSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const me = await requireUser();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	if (!(await assertParticipant(parsed.data.conversationId, me.id))) {
		return { ok: false, error: t("errForbidden") };
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
	const t = await getT();
	const me = await requireUser();
	if (!me) return { ok: false, error: t("errNotAuthenticated") };

	const count = await prisma.message.count({
		where: {
			NOT: { senderId: me.id },
			readAt: null,
			conversation: { participants: { some: { id: me.id } } },
		},
	});

	return { ok: true, data: count };
}
