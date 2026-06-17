"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateSupportUser } from "@/lib/support";

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
	const parsed = startSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Invalid input" };

	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: "Not authenticated" };

	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true },
	});
	if (!me) return { ok: false, error: "User not found" };

	if (me.id === parsed.data.targetUserId) {
		return { ok: false, error: "You cannot message yourself" };
	}

	const target = await prisma.user.findUnique({
		where: { id: parsed.data.targetUserId },
		select: { id: true },
	});
	if (!target) return { ok: false, error: "Recipient not found" };

	const conversationId = await findOrCreateDirectConversation(me.id, target.id);

	return { ok: true, data: { conversationId } };
}

/** Opens (or creates) the current user's conversation with Im-Vestor Support. */
export async function startSupportConversation(): Promise<
	ActionResult<{ conversationId: string }>
> {
	const { userId: clerkId } = await auth();
	if (!clerkId) return { ok: false, error: "Not authenticated" };

	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true },
	});
	if (!me) return { ok: false, error: "User not found" };

	const support = await getOrCreateSupportUser();
	if (me.id === support.id) {
		return { ok: false, error: "Support cannot message itself" };
	}

	const conversationId = await findOrCreateDirectConversation(
		me.id,
		support.id,
	);

	return { ok: true, data: { conversationId } };
}
