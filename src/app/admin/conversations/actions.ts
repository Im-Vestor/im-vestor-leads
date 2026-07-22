"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";
import { requireAdmin } from "./_admin-guard";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PAGE_SIZE = 20;

export type AdminConversationItem = {
	id: string;
	updatedAt: Date;
	messageCount: number;
	participants: { id: string; name: string | null; email: string }[];
};

const listSchema = z.object({
	search: z.string().trim().optional(),
	cursor: z.string().optional(),
});

export async function listAllConversations(
	input: z.input<typeof listSchema>,
): Promise<
	ActionResult<{ items: AdminConversationItem[]; nextCursor: string | null }>
> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = listSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const where = parsed.data.search
		? {
				participants: {
					some: {
						OR: [
							{
								name: {
									contains: parsed.data.search,
									mode: "insensitive" as const,
								},
							},
							{
								email: {
									contains: parsed.data.search,
									mode: "insensitive" as const,
								},
							},
						],
					},
				},
			}
		: undefined;

	const rows = await prisma.conversation.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		take: PAGE_SIZE + 1,
		...(parsed.data.cursor
			? { cursor: { id: parsed.data.cursor }, skip: 1 }
			: {}),
		include: {
			participants: { select: { id: true, name: true, email: true } },
			_count: { select: { messages: true } },
		},
	});

	let nextCursor: string | null = null;
	if (rows.length > PAGE_SIZE) {
		const last = rows.pop();
		nextCursor = last?.id ?? null;
	}

	const items: AdminConversationItem[] = rows.map((r) => ({
		id: r.id,
		updatedAt: r.updatedAt,
		messageCount: r._count.messages,
		participants: r.participants,
	}));

	return { ok: true, data: { items, nextCursor } };
}

const messagesSchema = z.object({
	conversationId: z.string().min(1),
});

export type AdminMessageItem = {
	id: string;
	content: string;
	createdAt: Date;
	sender: { id: string; name: string | null; email: string };
};

export async function getConversationMessagesAdmin(
	input: z.input<typeof messagesSchema>,
): Promise<ActionResult<AdminMessageItem[]>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = messagesSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const rows = await prisma.message.findMany({
		where: { conversationId: parsed.data.conversationId },
		orderBy: { createdAt: "asc" },
		include: {
			sender: { select: { id: true, name: true, email: true } },
		},
	});

	return {
		ok: true,
		data: rows.map((r) => ({
			id: r.id,
			content: r.content,
			createdAt: r.createdAt,
			sender: r.sender,
		})),
	};
}

const deleteMessageSchema = z.object({
	messageId: z.string().min(1),
});

export async function deleteMessage(
	input: z.input<typeof deleteMessageSchema>,
): Promise<ActionResult<{ id: string }>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = deleteMessageSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const deleted = await prisma.message.delete({
		where: { id: parsed.data.messageId },
		select: { id: true },
	});

	revalidatePath("/admin/conversations");
	return { ok: true, data: deleted };
}

const wordSchema = z.object({
	word: z
		.string()
		.trim()
		.min(2)
		.max(80)
		.regex(/^[\p{L}\p{N}\s-]+$/u, "Only letters, numbers, spaces and dashes"),
});

export async function addBannedWord(
	input: z.input<typeof wordSchema>,
): Promise<ActionResult<{ id: string; word: string }>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = wordSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? t("errInvalidWord"),
		};
	}

	const normalized = parsed.data.word.toLowerCase();
	try {
		const created = await prisma.bannedWord.create({
			data: { word: normalized, createdBy: admin.id },
			select: { id: true, word: true },
		});
		revalidatePath("/admin/conversations");
		return { ok: true, data: created };
	} catch {
		return { ok: false, error: t("errWordAlreadyExists") };
	}
}

const removeWordSchema = z.object({
	id: z.string().min(1),
});

export async function removeBannedWord(
	input: z.input<typeof removeWordSchema>,
): Promise<ActionResult<{ id: string }>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = removeWordSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const deleted = await prisma.bannedWord.delete({
		where: { id: parsed.data.id },
		select: { id: true },
	});
	revalidatePath("/admin/conversations");
	return { ok: true, data: deleted };
}

export async function listBannedWords(): Promise<
	ActionResult<{ id: string; word: string; createdAt: Date }[]>
> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const rows = await prisma.bannedWord.findMany({
		orderBy: { createdAt: "desc" },
		select: { id: true, word: true, createdAt: true },
	});
	return { ok: true, data: rows };
}
