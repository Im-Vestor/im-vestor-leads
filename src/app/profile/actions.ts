"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/user";

const sectorValues = [
	"TECHNOLOGY",
	"HEALTHCARE",
	"FINTECH",
	"EDTECH",
	"CLEANTECH",
	"ECOMMERCE",
	"SAAS",
	"AGRITECH",
	"PROPTECH",
	"BIOTECH",
] as const;
const rangeValues = [
	"R_10K_50K",
	"R_50K_200K",
	"R_200K_500K",
	"R_500K_1M",
	"R_1M_5M",
	"R_5M_PLUS",
] as const;

const profileSchema = z.object({
	name: z.string().trim().max(120).optional().or(z.literal("")),
	country: z.string().trim().max(80).optional().or(z.literal("")),
	investmentCapacity: z.enum(rangeValues).nullable().optional(),
	sectors: z.array(z.enum(sectorValues)).default([]),
});

export type ProfileInput = z.input<typeof profileSchema>;

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(
	input: ProfileInput,
): Promise<ProfileActionResult> {
	const { userId } = await auth();
	if (!userId) return { ok: false, error: "Not authenticated" };

	const parsed = profileSchema.safeParse(input);
	if (!parsed.success) {
		return { ok: false, error: "Invalid profile data" };
	}
	const data = parsed.data;

	const existing = await prisma.user.findUnique({
		where: { clerkId: userId },
		select: { role: true },
	});
	if (!existing) return { ok: false, error: "User not found" };
	const isInvestor = existing.role === "INVESTOR";

	try {
		await prisma.user.update({
			where: { clerkId: userId },
			data: {
				name: data.name?.trim() || null,
				country: data.country?.trim() || null,
				investmentCapacity: isInvestor ? (data.investmentCapacity ?? null) : null,
				sectors: isInvestor ? data.sectors : [],
			},
		});
	} catch {
		return { ok: false, error: "Could not save your profile" };
	}

	revalidatePath("/profile");
	return { ok: true };
}

export async function openBillingPortal(): Promise<void> {
	const user = await getOrCreateUser();
	if (!user?.stripeCustomerId) {
		redirect("/shop");
	}

	const h = await headers();
	const host = h.get("host") ?? "localhost:3000";
	const proto = h.get("x-forwarded-proto") ?? "http";
	const origin = h.get("origin") ?? `${proto}://${host}`;

	const session = await getStripe().billingPortal.sessions.create({
		customer: user.stripeCustomerId,
		return_url: `${origin}/profile`,
	});

	redirect(session.url);
}
