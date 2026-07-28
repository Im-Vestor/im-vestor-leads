"use client";

import { useEffect, useState } from "react";
import { getPresenceStatuses } from "@/app/messages/presence.actions";
import { PRESENCE_POLL_MS, type PresenceStatus } from "@/lib/messages/presence";

export function usePresenceStatuses(userIds: string[]) {
	const key = userIds.slice().sort().join(",");
	const [statuses, setStatuses] = useState<Record<string, PresenceStatus>>({});

	useEffect(() => {
		if (!key) {
			setStatuses({});
			return;
		}

		const ids = key.split(",");
		let cancelled = false;
		const fetchStatuses = async () => {
			const result = await getPresenceStatuses({ userIds: ids });
			if (cancelled) return;
			if (result.ok) setStatuses(result.data);
		};

		void fetchStatuses();
		const id = window.setInterval(fetchStatuses, PRESENCE_POLL_MS);
		const onFocus = () => void fetchStatuses();
		window.addEventListener("focus", onFocus);
		return () => {
			cancelled = true;
			window.clearInterval(id);
			window.removeEventListener("focus", onFocus);
		};
	}, [key]);

	return statuses;
}
