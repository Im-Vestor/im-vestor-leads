import { z } from "zod";

const serverSchema = z.object({
	CLERK_SECRET_KEY: z.string().min(1),
	DATABASE_URL: z.string().url(),
	DIRECT_URL: z.string().url(),
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	SUPABASE_SECRET_KEY: z.string().optional(),
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),
	STRIPE_PRICE_SUBSCRIPTION_MONTHLY: z.string().optional(),
	STRIPE_PRICE_SUBSCRIPTION_ANNUAL: z.string().optional(),
	STRIPE_PRICE_POKE_PACK_3: z.string().optional(),
	STRIPE_PRICE_POKE_PACK_5: z.string().optional(),
	STRIPE_PRICE_POKE_PACK_10: z.string().optional(),
	STRIPE_PRICE_POKE_PACK_3_MONTHLY: z.string().optional(),
	STRIPE_PRICE_POKE_PACK_5_MONTHLY: z.string().optional(),
	STRIPE_PRICE_POKE_PACK_10_MONTHLY: z.string().optional(),
	STRIPE_PRICE_LEAD_CREDIT: z.string().optional(),
	STRIPE_PRICE_HYPERTRAIN_TICKET: z.string().optional(),
});

const clientSchema = z.object({
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
	NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

const clientEnv = {
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
	NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

const isServer = typeof window === "undefined";

const parsedClient = clientSchema.safeParse(clientEnv);
if (!parsedClient.success) {
	console.error(
		"❌ Invalid client environment variables:",
		z.flattenError(parsedClient.error).fieldErrors,
	);
	throw new Error("Invalid client environment variables");
}

let server: z.infer<typeof serverSchema> | undefined;
if (isServer) {
	const parsedServer = serverSchema.safeParse(process.env);
	if (!parsedServer.success) {
		console.error(
			"❌ Invalid server environment variables:",
			z.flattenError(parsedServer.error).fieldErrors,
		);
		throw new Error("Invalid server environment variables");
	}
	server = parsedServer.data;
}

export const env = {
	...parsedClient.data,
	...(server ?? ({} as z.infer<typeof serverSchema>)),
};
