import "server-only";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@/generated/prisma/enums";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

function generateReferralCode(seed: string): string {
	const base = seed
		.replace(/[^a-zA-Z]/g, "")
		.slice(0, 4)
		.toUpperCase()
		.padEnd(4, "X");
	const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
	return `${base}-${suffix}`;
}

export async function syncNameToClerk(
	clerkId: string,
	name: string | null,
): Promise<boolean> {
	const [firstName = "", ...rest] = (name ?? "").trim().split(/\s+/);
	try {
		const client = await clerkClient();
		await client.users.updateUser(clerkId, {
			firstName,
			lastName: rest.join(" "),
		});
		return true;
	} catch (error) {
		console.error("Failed to sync name to Clerk", error);
		return false;
	}
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

export async function getOrCreateStripeCustomerId(user: {
	id: string;
	clerkId: string;
	email: string;
	stripeCustomerId: string | null;
}): Promise<string> {
	if (user.stripeCustomerId) return user.stripeCustomerId;

	const customer = await getStripe().customers.create({
		email: user.email || undefined,
		metadata: { userId: user.id, clerkId: user.clerkId },
	});
	await prisma.user.update({
		where: { id: user.id },
		data: { stripeCustomerId: customer.id },
	});
	return customer.id;
}
