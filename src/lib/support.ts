import "server-only";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * The shared "Im-Vestor Support" account. Every user can message it, and any
 * admin replies on its behalf from the admin support inbox. It is never logged
 * into directly, so its clerkId is a sentinel that no real Clerk session matches.
 */
export const SUPPORT_CLERK_ID = "im-vestor-support";
export const SUPPORT_EMAIL = "support@im-vestor.com";
export const SUPPORT_NAME = "Im-Vestor Support";
const SUPPORT_REFERRAL_CODE = "SUPPORT-TEAM";

export type SupportUser = {
	id: string;
	name: string | null;
	email: string;
	role: UserRole;
};

const SUPPORT_SELECT = {
	id: true,
	name: true,
	email: true,
	role: true,
} as const;

export async function getOrCreateSupportUser(): Promise<SupportUser> {
	const existing = await prisma.user.findUnique({
		where: { clerkId: SUPPORT_CLERK_ID },
		select: SUPPORT_SELECT,
	});
	if (existing) return existing;

	// upsert keeps this race-safe if two requests create the support user at once.
	return prisma.user.upsert({
		where: { clerkId: SUPPORT_CLERK_ID },
		update: {},
		create: {
			clerkId: SUPPORT_CLERK_ID,
			email: SUPPORT_EMAIL,
			name: SUPPORT_NAME,
			role: UserRole.ADMIN,
			referralCode: SUPPORT_REFERRAL_CODE,
		},
		select: SUPPORT_SELECT,
	});
}
