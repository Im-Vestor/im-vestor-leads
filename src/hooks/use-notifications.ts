"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getNotifications,
	markNotificationAsRead,
	markNotificationsAsRead,
	type NotificationItem,
} from "@/app/messages/notifications.actions";
import { type PokeResponseResult, respondToPoke } from "@/app/pokes/actions";
import { useRealtimeNotifications } from "./use-realtime-notifications";

export type AnswerPokeResult =
	| { ok: true; data: PokeResponseResult }
	| { ok: false; error: string };

/**
 * Feed behind the header bell. Loads the latest page, keeps the unread badge
 * live over Supabase Realtime, and applies read state optimistically so the
 * badge never lags behind the click.
 */
export function useNotifications(userId: string | null) {
	const [items, setItems] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);

	// Never rejects: the bell is ambient UI, and a failed fetch must not surface
	// as a runtime error. It simply keeps whatever it was already showing.
	const refresh = useCallback(async () => {
		try {
			const result = await getNotifications();
			if (!result.ok) return;
			setItems(result.data.items);
			setUnreadCount(result.data.unreadCount);
		} catch {
			// offline, or the action failed — the next tick will try again
		}
	}, []);

	useEffect(() => {
		if (!userId) {
			setItems([]);
			setUnreadCount(0);
			return;
		}
		setLoading(true);
		void refresh().finally(() => setLoading(false));
	}, [userId, refresh]);

	useRealtimeNotifications(
		userId,
		useCallback(() => {
			void refresh();
		}, [refresh]),
	);

	const markOneRead = useCallback(async (id: string) => {
		let wasUnread = false;
		setItems((prev) =>
			prev.map((item) => {
				if (item.id !== id || item.read) return item;
				wasUnread = true;
				return { ...item, read: true };
			}),
		);
		if (!wasUnread) return;
		setUnreadCount((prev) => Math.max(0, prev - 1));
		await markNotificationAsRead({ id }).catch(() => {});
	}, []);

	const markAllRead = useCallback(async () => {
		setItems((prev) => prev.map((item) => ({ ...item, read: true })));
		setUnreadCount(0);
		await markNotificationsAsRead().catch(() => {});
	}, []);

	/**
	 * Accept or reject a poke straight from the feed. The row's status is
	 * flipped before the server answers so the buttons cannot be pressed twice,
	 * and a refresh reconciles it either way — including the failure where the
	 * poke was already answered somewhere else.
	 */
	const answerPoke = useCallback(
		async (
			pokeId: string,
			action: "accept" | "reject",
		): Promise<AnswerPokeResult> => {
			const optimistic = action === "accept" ? "ACCEPTED" : "REJECTED";
			setItems((prev) =>
				prev.map((item) =>
					item.poke?.id === pokeId
						? {
								...item,
								read: true,
								poke: { ...item.poke, status: optimistic },
							}
						: item,
				),
			);

			try {
				const result = await respondToPoke({ pokeId, action });
				await refresh();
				return result;
			} catch {
				await refresh();
				return { ok: false, error: "" };
			}
		},
		[refresh],
	);

	return {
		items,
		unreadCount,
		loading,
		refresh,
		markOneRead,
		markAllRead,
		answerPoke,
	};
}
