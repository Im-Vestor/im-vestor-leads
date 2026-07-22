import { z } from "zod";

export const CURRENCIES = ["EUR", "USD", "BRL"] as const;

export const CURRENCY_SYMBOLS: Record<(typeof CURRENCIES)[number], string> = {
	EUR: "€",
	USD: "$",
	BRL: "R$",
};

export const PROJECT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> =
	{
		DRAFT: "Draft",
		PUBLISHED: "Published",
		ARCHIVED: "Archived",
	};

const optionalText = (max: number) =>
	z.string().trim().max(max).optional().or(z.literal(""));

const optionalPositiveInt = z.number().int().min(0).nullable().optional();

export const projectMediaSchema = z.object({
	type: z.enum(["PHOTO", "VIDEO"]),
	url: z.string().url(),
	caption: optionalText(50),
});

export const projectSchema = z.object({
	name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
	quickSolution: optionalText(250),
	about: optionalText(2000),
	website: optionalText(200),
	country: optionalText(80),
	areaIds: z
		.array(z.string().min(1))
		.min(1, "Pick at least one sector")
		.max(3, "Pick at most 3 sectors"),
	currency: z.enum(CURRENCIES),
	investmentGoal: z.number().int().min(1, "Investment goal is required"),
	startInvestment: optionalPositiveInt,
	equity: z.number().min(0).max(100).nullable().optional(),
	annualRevenue: optionalPositiveInt,
	monthsToReturn: optionalPositiveInt,
	investorSlots: optionalPositiveInt,
	logo: optionalText(500),
	videoPitchUrl: optionalText(500),
	media: z.array(projectMediaSchema).max(3).default([]),
});

export type ProjectInput = z.input<typeof projectSchema>;
