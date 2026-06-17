"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type RealtimeNotificationRow = {
	id: string;
	user_id: string;
	type: string;
	read: boolean;
	message: string | null;
	sender_id: string | null;
	created_at: string;
};

// Monotonic counter so every subscription gets a unique channel topic.
// Supabase dedupes channels by topic, and `removeChannel()` only frees the
// topic *after* an async `unsubscribe()` round-trip resolves. Under React
// Strict Mode (and on any fast unmount/remount), the effect re-runs before
// that cleanup finishes — a shared topic like `notifications:${userId}` would
// then hand back the still-subscribed channel and `.on("postgres_changes", …)`
// throws "cannot add postgres_changes callbacks … after subscribe()". A fresh
// topic per mount sidesteps the collision entirely.
let channelSeq = 0;

export function useRealtimeNotifications(
	userId: string | null,
	onInsert: (row: RealtimeNotificationRow) => void,
) {
	useEffect(() => {
		if (!userId) return;
		const channel = supabase
			.channel(`notifications:${userId}:${++channelSeq}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications",
					filter: `user_id=eq.${userId}`,
				},
				(payload) => onInsert(payload.new as RealtimeNotificationRow),
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, onInsert]);
}
