"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupportUnreadCount } from "@/app/admin/support/actions";
import { subscribeSupportRead } from "@/lib/unread-events";
import { useRealtimeNotifications } from "./use-realtime-notifications";

export function useUnreadSupportCount(enabled: boolean) {
	const [count, setCount] = useState(0);
	const [supportUserId, setSupportUserId] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const result = await getSupportUnreadCount();
		if (result.ok) {
			setCount(result.data.count);
			setSupportUserId(result.data.supportUserId);
		}
	}, []);

	useEffect(() => {
		if (!enabled) {
			setCount(0);
			return;
		}
		void refresh();
	}, [enabled, refresh]);

	useRealtimeNotifications(
		enabled ? supportUserId : null,
		useCallback(() => {
			void refresh();
		}, [refresh]),
	);

	useEffect(() => {
		if (!enabled) return;
		return subscribeSupportRead(() => {
			void refresh();
		});
	}, [enabled, refresh]);

	return { count, refresh };
}
