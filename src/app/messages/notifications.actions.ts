"use server";

import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@/generated/prisma/enums";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

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
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "Not authenticated" };

	const count = await prisma.notification.count({
		where: { userId, read: false },
	});
	return { ok: true, data: count };
}

export async function markNotificationsAsRead(): Promise<
	ActionResult<{ count: number }>
> {
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "Not authenticated" };

	const result = await prisma.notification.updateMany({
		where: { userId, read: false },
		data: { read: true },
	});
	return { ok: true, data: { count: result.count } };
}

export async function getMyUserId(): Promise<ActionResult<string>> {
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "Not authenticated" };
	return { ok: true, data: userId };
}

export async function getMyRole(): Promise<ActionResult<UserRole>> {
	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: "Not authenticated" };
	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true, role: true, email: true },
	});
	if (!me) return { ok: false, error: "User not found" };

	// Promote to admin if their email was added to ADMIN_EMAILS after signup, so
	// the Admin link surfaces on the next page load without visiting /messages.
	if (me.role !== UserRole.ADMIN && isAdminEmail(me.email)) {
		await prisma.user.update({
			where: { id: me.id },
			data: { role: UserRole.ADMIN },
		});
		return { ok: true, data: UserRole.ADMIN };
	}

	return { ok: true, data: me.role };
}
