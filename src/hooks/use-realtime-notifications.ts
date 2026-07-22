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
