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

	useRealtimeNotifications(
		userId,
		useCallback(() => {
			void refresh();
		}, [refresh]),
	);

	useEffect(() => subscribeMessagesRead(() => void refresh()), [refresh]);

	return { count, refresh };
}
