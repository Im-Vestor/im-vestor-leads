export type PresenceStatus = "online" | "away" | "offline";

/** Client sends a heartbeat this often while the tab is open. */
export const PRESENCE_HEARTBEAT_MS = 45_000;

/** Clients poll each other's status this often. */
export const PRESENCE_POLL_MS = 30_000;

/** No heartbeat within this window → offline (tolerates two missed beats). */
export const PRESENCE_STALE_MS = 150_000;

/** No user interaction within this window → away. */
export const PRESENCE_IDLE_MS = 5 * 60_000;

export function resolvePresence(
	lastSeenAt: Date | string | null | undefined,
	lastActiveAt: Date | string | null | undefined,
	now: number = Date.now(),
): PresenceStatus {
	if (!lastSeenAt) return "offline";
	const seen = new Date(lastSeenAt).getTime();
	if (now - seen > PRESENCE_STALE_MS) return "offline";

	if (!lastActiveAt) return "away";
	const active = new Date(lastActiveAt).getTime();
	return now - active > PRESENCE_IDLE_MS ? "away" : "online";
}
