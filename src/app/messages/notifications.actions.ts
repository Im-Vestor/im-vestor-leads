"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { NotificationType, PokeStatus } from "@/generated/prisma/enums";
import { UserRole } from "@/generated/prisma/enums";
import { isAdminEmail } from "@/lib/admin";
import { expireDuePokes } from "@/lib/pokes-expire";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** How many rows the bell popover holds. */
const NOTIFICATION_PAGE_SIZE = 20;

async function requireUserId() {
	const { userId: clerkId } = await auth();
	if (!clerkId) return null;
	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true },
	});
	return me?.id ?? null;
}

export async function getNotificationsUnreadCount(): Promise<
	ActionResult<number>
> {
	const t = await getT();
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: t("errNotAuthenticated") };

	const count = await prisma.notification.count({
		where: { userId, read: false },
	});
	return { ok: true, data: count };
}

export type NotificationItem = {
	id: string;
	type: NotificationType;
	message: string | null;
	link: string | null;
	read: boolean;
	createdAt: Date;
	senderName: string | null;
	/** Present on the POKE_* rows — its status is what decides whether the row
	 * still offers Accept/Reject or just reports how it ended. */
	poke: { id: string; status: PokeStatus } | null;
};

/** The bell popover feed: newest first, capped at one page. */
export async function getNotifications(): Promise<
	ActionResult<{ items: NotificationItem[]; unreadCount: number }>
> {
	const t = await getT();
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: t("errNotAuthenticated") };

	await expireDuePokes();

	const [rows, unreadCount] = await Promise.all([
		prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: NOTIFICATION_PAGE_SIZE,
			select: {
				id: true,
				type: true,
				message: true,
				link: true,
				read: true,
				createdAt: true,
				senderId: true,
				poke: { select: { id: true, status: true } },
			},
		}),
		prisma.notification.count({ where: { userId, read: false } }),
	]);

	const senderIds = [
		...new Set(rows.map((r) => r.senderId).filter((id): id is string => !!id)),
	];
	const senders = senderIds.length
		? await prisma.user.findMany({
				where: { id: { in: senderIds } },
				select: { id: true, name: true, email: true },
			})
		: [];
	const nameById = new Map(
		senders.map((s) => [s.id, s.name?.trim() || s.email] as const),
	);

	const items: NotificationItem[] = rows.map(({ senderId, ...row }) => ({
		...row,
		senderName: senderId ? (nameById.get(senderId) ?? null) : null,
	}));

	return { ok: true, data: { items, unreadCount } };
}

const notificationIdSchema = z.object({ id: z.string().min(1) });

/** Marks a single row read — used when a notification is clicked. */
export async function markNotificationAsRead(
	input: z.input<typeof notificationIdSchema>,
): Promise<ActionResult<{ count: number }>> {
	const t = await getT();
	const parsed = notificationIdSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const userId = await requireUserId();
	if (!userId) return { ok: false, error: t("errNotAuthenticated") };

	const result = await prisma.notification.updateMany({
		where: { id: parsed.data.id, userId, read: false },
		data: { read: true },
	});
	return { ok: true, data: { count: result.count } };
}

export async function markNotificationsAsRead(): Promise<
	ActionResult<{ count: number }>
> {
	const t = await getT();
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: t("errNotAuthenticated") };

	const result = await prisma.notification.updateMany({
		where: { userId, read: false },
		data: { read: true },
	});
	return { ok: true, data: { count: result.count } };
}

export async function getMyUserId(): Promise<ActionResult<string>> {
	const t = await getT();
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: t("errNotAuthenticated") };
	return { ok: true, data: userId };
}

export async function getMyRole(): Promise<ActionResult<UserRole>> {
	const t = await getT();
	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: t("errNotAuthenticated") };
	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true, role: true, email: true },
	});
	if (!me) return { ok: false, error: t("errUserNotFound") };

	if (me.role !== UserRole.ADMIN && isAdminEmail(me.email)) {
		await prisma.user.update({
			where: { id: me.id },
			data: { role: UserRole.ADMIN },
		});
		return { ok: true, data: UserRole.ADMIN };
	}

	return { ok: true, data: me.role };
}
