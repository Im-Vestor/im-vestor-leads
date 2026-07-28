"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { SUPPORT_CLERK_ID } from "@/lib/support";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type AdminUserRow = {
	id: string;
	name: string | null;
	email: string;
	role: string;
	pokes: number;
	leadCredits: number;
};

const userSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	pokes: true,
	leadCredits: true,
} as const;

const listSchema = z.object({
	search: z.string().trim().max(200).default(""),
});

export async function listUsers(
	input?: z.input<typeof listSchema>,
): Promise<ActionResult<AdminUserRow[]>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = listSchema.safeParse(input ?? {});
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };
	const { search } = parsed.data;

	const users = await prisma.user.findMany({
		where: {
			NOT: { clerkId: SUPPORT_CLERK_ID },
			...(search
				? {
						OR: [
							{ email: { contains: search, mode: "insensitive" } },
							{ name: { contains: search, mode: "insensitive" } },
						],
					}
				: {}),
		},
		orderBy: { createdAt: "desc" },
		take: 50,
		select: userSelect,
	});

	return { ok: true, data: users };
}

const adjustSchema = z.object({
	userId: z.string().min(1),
	field: z.enum(["pokes", "leadCredits"]),
	// One grant is capped so a stray keypress can't hand out a fortune.
	delta: z
		.number()
		.int()
		.gte(-1000)
		.lte(1000)
		.refine((n) => n !== 0),
});

/**
 * Adds `delta` to a member's poke or lead-credit balance (negative removes).
 * The balance floors at zero — you cannot push someone into debt.
 */
export async function adjustBalance(
	input: z.input<typeof adjustSchema>,
): Promise<ActionResult<AdminUserRow>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = adjustSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };
	const { userId, field, delta } = parsed.data;

	const user = await prisma.user.findFirst({
		where: { id: userId, NOT: { clerkId: SUPPORT_CLERK_ID } },
		select: userSelect,
	});
	if (!user) return { ok: false, error: t("errRecipientNotFound") };

	const next = Math.max(0, user[field] + delta);

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { [field]: next },
		select: userSelect,
	});

	return { ok: true, data: updated };
}
