"use client";

import { useCallback, useEffect, useState } from "react";
import { getUnreadMessageCount } from "@/app/messages/actions";
import { subscribeMessagesRead } from "@/lib/unread-events";
import { useRealtimeNotifications } from "./use-realtime-notifications";

export function useUnreadCount(userId: string | null) {
	const [count, setCount] = useState(0);

	const refresh = useCallback(async () => {
		const result = await getUnreadMessageCount();
		if (result.ok) setCount(result.data);
	}, []);

	useEffect(() => {
		if (!userId) {
			setCount(0);
			return;
		}
		void refresh();
	}, [userId, refresh]);

	// New incoming message → an unread notification is inserted for me.
	useRealtimeNotifications(
		userId,
		useCallback(() => {
			void refresh();
		}, [refresh]),
	);

	// A conversation was marked read elsewhere in the tree → recount.
	useEffect(() => subscribeMessagesRead(() => void refresh()), [refresh]);

	return { count, refresh };
}
