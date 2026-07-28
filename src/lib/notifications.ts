import "server-only";
import type { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type NotificationInput = {
	userId: string;
	type: NotificationType;
	/** Dynamic detail only — the title is derived from `type` and translated. */
	message?: string | null;
	/** Where the row navigates to, e.g. "/projects/<id>". */
	link?: string | null;
	senderId?: string | null;
};

/**
 * Writes in-app notifications. Never throws: a failed insert must not break the
 * purchase, unlock or message that triggered it. The row is what drives the
 * header bell, and its INSERT is what Supabase Realtime broadcasts.
 */
export async function createNotifications(
	inputs: NotificationInput[],
): Promise<void> {
	if (inputs.length === 0) return;
	try {
		await prisma.notification.createMany({
			data: inputs.map((n) => ({
				userId: n.userId,
				type: n.type,
				message: n.message ?? null,
				link: n.link ?? null,
				senderId: n.senderId ?? null,
			})),
		});
	} catch (err) {
		console.error("[notifications] insert failed:", err);
	}
}

export async function createNotification(
	input: NotificationInput,
): Promise<void> {
	return createNotifications([input]);
}
