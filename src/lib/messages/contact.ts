import "server-only";
import { findDirectConversation } from "@/lib/messages/conversation";
import { prisma } from "@/lib/prisma";

/**
 * Who is allowed to open a thread with whom.
 *
 * A profile in a listing is a door, not an invitation: an entrepreneur who
 * finds an investor cannot write to them until that investor accepted the
 * poke. Acceptance is what is being sold, so it is checked on the server —
 * hiding the button is only the courtesy half of it.
 *
 * Acceptance opens the door in *both* directions: once two members are
 * connected, either of them can start writing.
 */

async function hasAcceptedPoke(aId: string, bId: string): Promise<boolean> {
	const accepted = await prisma.poke.findFirst({
		where: {
			status: "ACCEPTED",
			OR: [
				{ senderId: aId, receiverId: bId },
				{ senderId: bId, receiverId: aId },
			],
		},
		select: { id: true },
	});
	return accepted !== null;
}

/** Whether these two may talk directly — an open thread, or an accepted poke. */
export async function canMessageDirectly(
	aId: string,
	bId: string,
): Promise<boolean> {
	if (await findDirectConversation(aId, bId)) return true;
	return hasAcceptedPoke(aId, bId);
}

/**
 * Everyone this user may already write to. Lists that render a "Message" or a
 * "Poke" button per row ask once for the whole page instead of once per row,
 * and get the same answer {@link canMessageDirectly} would give.
 */
export async function openContactIds(userId: string): Promise<Set<string>> {
	const [conversations, pokes] = await Promise.all([
		prisma.conversation.findMany({
			where: { participants: { some: { id: userId } } },
			select: { participants: { select: { id: true } } },
		}),
		prisma.poke.findMany({
			where: {
				status: "ACCEPTED",
				OR: [{ senderId: userId }, { receiverId: userId }],
			},
			select: { senderId: true, receiverId: true },
		}),
	]);

	const ids = new Set<string>();
	for (const conversation of conversations) {
		// A group thread is not a direct line to any one of its members.
		if (conversation.participants.length !== 2) continue;
		for (const p of conversation.participants) {
			if (p.id !== userId) ids.add(p.id);
		}
	}
	for (const poke of pokes) {
		ids.add(poke.senderId === userId ? poke.receiverId : poke.senderId);
	}
	return ids;
}
