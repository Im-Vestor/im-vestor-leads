/**
 * Shared poke rules. No `server-only` here: the send dialog reads the same
 * limits the server enforces, so the two can never drift apart.
 */

/** Intro note carried by a poke. Short on purpose — it is a knock, not a pitch. */
export const POKE_MESSAGE_MAX_LENGTH = 280;

/**
 * How long a pending request stays open. The column is NOT NULL in the
 * database and predates this flow; nothing sweeps expired rows yet, so the
 * value is stored for the record rather than enforced on read.
 */
export const POKE_TTL_DAYS = 30;

export function pokeExpiryFrom(now: Date): Date {
	return new Date(now.getTime() + POKE_TTL_DAYS * 24 * 60 * 60 * 1000);
}
