"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { type PresenceStatus, resolvePresence } from "@/lib/messages/presence";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const heartbeatSchema = z.object({
	active: z.boolean(),
});

export async function heartbeat(
	input: z.input<typeof heartbeatSchema>,
): Promise<ActionResult<{ ok: true }>> {
	const t = await getT();
	const parsed = heartbeatSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: t("errNotAuthenticated") };

	// `updateMany`, not `update`: the heartbeat runs for every signed-in session,
	// including one whose Clerk account has no `users` row yet (signed up but
	// never finished onboarding). `update` throws P2025 there, and presence is
	// not worth failing over — no row simply means nothing to record.
	const now = new Date();
	await prisma.user.updateMany({
		where: { clerkId },
		data: {
			lastSeenAt: now,
			...(parsed.data.active ? { lastActiveAt: now } : {}),
		},
	});
	return { ok: true, data: { ok: true } };
}

const getStatusesSchema = z.object({
	userIds: z.array(z.string().min(1)).max(100),
});

export async function getPresenceStatuses(
	input: z.input<typeof getStatusesSchema>,
): Promise<ActionResult<Record<string, PresenceStatus>>> {
	const t = await getT();
	const parsed = getStatusesSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: t("errNotAuthenticated") };

	if (parsed.data.userIds.length === 0) return { ok: true, data: {} };

	const users = await prisma.user.findMany({
		where: { id: { in: parsed.data.userIds } },
		select: { id: true, lastSeenAt: true, lastActiveAt: true },
	});

	const now = Date.now();
	const out: Record<string, PresenceStatus> = {};
	for (const u of users) {
		out[u.id] = resolvePresence(u.lastSeenAt, u.lastActiveAt, now);
	}
	return { ok: true, data: out };
}
