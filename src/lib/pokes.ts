/**
 * Shared poke rules. No `server-only` here: the send dialog reads the same
 * limits the server enforces, so the two can never drift apart.
 */

/** Intro note carried by a poke. Short on purpose — it is a knock, not a pitch. */
export const POKE_MESSAGE_MAX_LENGTH = 280;

export const POKE_TTL_DAYS = 7;

export function pokeExpiryFrom(now: Date): Date {
	return new Date(now.getTime() + POKE_TTL_DAYS * 24 * 60 * 60 * 1000);
}
