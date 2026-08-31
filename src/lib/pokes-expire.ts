import "server-only";
import { prisma } from "@/lib/prisma";

const SWEEP_BATCH = 200;

export async function expireDuePokes(now = new Date()): Promise<number> {
	const due = await prisma.poke.findMany({
		where: { status: "PENDING", expiresAt: { lte: now } },
		select: { id: true, senderId: true },
		take: SWEEP_BATCH,
	});

	let expired = 0;
	for (const poke of due) {
		const settled = await prisma.$transaction(async (tx) => {
			const flipped = await tx.poke.updateMany({
				where: { id: poke.id, status: "PENDING" },
				data: { status: "EXPIRED" },
			});
			if (flipped.count === 0) return false;

			await tx.user.update({
				where: { id: poke.senderId },
				data: { pokes: { increment: 1 } },
			});

			await tx.notification.updateMany({
				where: { pokeId: poke.id, read: false },
				data: { read: true },
			});

			return true;
		});
		if (settled) expired++;
	}

	return expired;
}
