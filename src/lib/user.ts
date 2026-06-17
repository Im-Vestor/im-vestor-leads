import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@/generated/prisma/enums";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function generateReferralCode(seed: string): string {
	const base = seed
		.replace(/[^a-zA-Z]/g, "")
		.slice(0, 4)
		.toUpperCase()
		.padEnd(4, "X");
	const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
	return `${base}-${suffix}`;
}

export async function getCurrentUser() {
	const { userId } = await auth();
	if (!userId) return null;
	return prisma.user.findUnique({ where: { clerkId: userId } });
}

export async function getOrCreateUser() {
	const { userId } = await auth();
	if (!userId) return null;

	const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
	if (existing) {
		// Promote to admin if their email was added to ADMIN_EMAILS after signup.
		if (existing.role !== UserRole.ADMIN && isAdminEmail(existing.email)) {
			return prisma.user.update({
				where: { id: existing.id },
				data: { role: UserRole.ADMIN },
			});
		}
		return existing;
	}

	const clerkUser = await currentUser();
	const email =
		clerkUser?.primaryEmailAddress?.emailAddress ??
		clerkUser?.emailAddresses[0]?.emailAddress ??
		"";
	const name =
		[clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
		null;

	return prisma.user.create({
		data: {
			clerkId: userId,
			email,
			name,
			role: isAdminEmail(email) ? UserRole.ADMIN : UserRole.ENTREPRENEUR,
			referralCode: generateReferralCode(name ?? email ?? userId),
		},
	});
}
