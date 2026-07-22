"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { syncNameToClerk } from "@/lib/user";
import { getT } from "@/utils/translations/server";

const roleValues = ["ENTREPRENEUR", "INVESTOR"] as const;
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

const signupSchema = z
	.object({
		email: z.string().email(),
		name: z.string().trim().max(120).optional().or(z.literal("")),
		country: z.string().trim().max(80).optional().or(z.literal("")),
		role: z.enum(roleValues),
		referredByCode: z.string().trim().max(20).optional().or(z.literal("")),
		investmentCapacity: z.enum(rangeValues).nullable().optional(),
		sectors: z.array(z.enum(sectorValues)).default([]),
	})
	.transform((d) =>
		d.role === "INVESTOR" ? d : { ...d, investmentCapacity: null, sectors: [] },
	);

export type CompleteSignupInput = z.input<typeof signupSchema>;
export type CompleteSignupResult = { ok: true } | { ok: false; error: string };

function generateReferralCode(seed: string): string {
	const base = seed
		.replace(/[^a-zA-Z]/g, "")
		.slice(0, 4)
		.toUpperCase()
		.padEnd(4, "X");
	const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
	return `${base}-${suffix}`;
}

export async function completeSignup(
	input: CompleteSignupInput,
): Promise<CompleteSignupResult> {
	const t = await getT();
	const { userId } = await auth();
	if (!userId) return { ok: false, error: t("errNotAuthenticated") };

	const parsed = signupSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidSignupData") };
	const data = parsed.data;

	let referredByCode: string | null = null;
	if (data.referredByCode) {
		const code = data.referredByCode.toUpperCase();
		const referrer = await prisma.user.findUnique({
			where: { referralCode: code },
			select: { id: true },
		});
		if (referrer) referredByCode = code;
	}

	try {
		await prisma.user.upsert({
			where: { clerkId: userId },
			update: {
				email: data.email,
				name: data.name?.trim() || null,
				country: data.country?.trim() || null,
				role: data.role,
				investmentCapacity: data.investmentCapacity ?? null,
				sectors: data.sectors,
				referredByCode,
			},
			create: {
				clerkId: userId,
				email: data.email,
				name: data.name?.trim() || null,
				country: data.country?.trim() || null,
				role: data.role,
				investmentCapacity: data.investmentCapacity ?? null,
				sectors: data.sectors,
				referredByCode,
				referralCode: generateReferralCode(data.name || data.email),
			},
		});
	} catch {
		return { ok: false, error: t("errCouldNotCreateProfile") };
	}

	await syncNameToClerk(userId, data.name?.trim() || null);

	return { ok: true };
}
