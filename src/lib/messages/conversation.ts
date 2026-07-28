import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The existing direct thread between two members, or null.
 *
 * Its existence is proof that some path already earned the introduction — an
 * accepted poke, an unlocked lead, support — so callers can treat it as
 * standing permission instead of asking how it was opened.
 */
export async function findDirectConversation(
	aId: string,
	bId: string,
	client: Prisma.TransactionClient = prisma,
): Promise<string | null> {
	const existing = await client.conversation.findFirst({
		where: {
			AND: [
				{ participants: { some: { id: aId } } },
				{ participants: { some: { id: bId } } },
			],
		},
		select: { id: true, participants: { select: { id: true } } },
	});
	// A group thread that happens to contain both is not their direct one.
	return existing && existing.participants.length === 2 ? existing.id : null;
}

/**
 * The one direct thread between two members, created on first need.
 *
 * Every way into the inbox lands here — a profile, an unlocked lead, support,
 * an accepted poke — and all of them must reach the *same* thread, otherwise a
 * pair ends up with parallel histories. Callers that already hold a transaction
 * pass it in so the conversation commits with whatever opened it.
 */
export async function findOrCreateDirectConversation(
	aId: string,
	bId: string,
	tx?: Prisma.TransactionClient,
): Promise<string> {
	const run = async (client: Prisma.TransactionClient) => {
		const existing = await findDirectConversation(aId, bId, client);
		if (existing) return existing;

		const created = await client.conversation.create({
			data: { participants: { connect: [{ id: aId }, { id: bId }] } },
			select: { id: true },
		});
		return created.id;
	};

	return tx ? run(tx) : prisma.$transaction(run);
}
