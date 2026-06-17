import "server-only";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/** Emails (lowercased) that should be granted the ADMIN role automatically. */
export function getAdminEmails(): string[] {
	return (process.env.ADMIN_EMAILS ?? "")
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
	if (!email) return false;
	return getAdminEmails().includes(email.toLowerCase());
}

/** Returns the current user if they are an admin, otherwise null. */
export async function requireAdmin() {
	const { userId: clerkId } = await auth();
	if (!clerkId) return null;
	const me = await prisma.user.findUnique({
		where: { clerkId },
		select: { id: true, role: true },
	});
	if (me?.role !== "ADMIN") return null;
	return me;
}
