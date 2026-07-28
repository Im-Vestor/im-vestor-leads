"use client";

import { useEffect, useRef } from "react";
import { heartbeat } from "@/app/messages/presence.actions";
import {
	PRESENCE_HEARTBEAT_MS,
	PRESENCE_IDLE_MS,
} from "@/lib/messages/presence";

const ACTIVITY_EVENTS = [
	"pointerdown",
	"keydown",
	"wheel",
	"touchstart",
	"scroll",
] as const;

/**
 * Reports this user's presence while the app is open: a heartbeat every
 * PRESENCE_HEARTBEAT_MS carrying whether the user is actually interacting.
 * Idle (no input for PRESENCE_IDLE_MS) or a hidden tab reports inactive, which
 * the server turns into "away"; a stale heartbeat becomes "offline".
 */
export function usePresenceHeartbeat(enabled = true) {
	const lastActivityRef = useRef(Date.now());
	const wasActiveRef = useRef(true);

	useEffect(() => {
		if (!enabled) return;
		if (typeof document === "undefined") return;

		let cancelled = false;

		const isActive = () =>
			!document.hidden &&
			Date.now() - lastActivityRef.current < PRESENCE_IDLE_MS;

		const send = (active: boolean) => {
			if (cancelled) return;
			wasActiveRef.current = active;
			// Presence is a background nicety. Swallow failures instead of letting
			// a rejected floating promise surface as a runtime error to the user.
			heartbeat({ active }).catch(() => {});
		};

		const tick = () => send(isActive());

		const onActivity = () => {
			lastActivityRef.current = Date.now();
			// Coming back from idle should show up right away, not on the next tick.
			if (!wasActiveRef.current && !document.hidden) send(true);
		};

		const onVisibility = () => {
			if (!document.hidden) lastActivityRef.current = Date.now();
			tick();
		};

		tick();
		const id = window.setInterval(tick, PRESENCE_HEARTBEAT_MS);
		for (const event of ACTIVITY_EVENTS) {
			window.addEventListener(event, onActivity, { passive: true });
		}
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			cancelled = true;
			window.clearInterval(id);
			for (const event of ACTIVITY_EVENTS) {
				window.removeEventListener(event, onActivity);
			}
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [enabled]);
}
