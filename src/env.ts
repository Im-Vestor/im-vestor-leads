import { z } from "zod";

/**
 * Server-side environment variables. Never exposed to the browser.
 */
const serverSchema = z.object({
	CLERK_SECRET_KEY: z.string().min(1),
	// Pooled connection (PgBouncer, port 6543) used by Prisma Client at runtime.
	DATABASE_URL: z.string().url(),
	// Direct connection (port 5432) used by the Prisma CLI for migrations.
	DIRECT_URL: z.string().url(),
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
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
});

/**
 * Client-side environment variables. Must be prefixed with `NEXT_PUBLIC_`
 * and referenced literally below so Next.js can inline them at build time.
 */
const clientSchema = z.object({
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
	NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

/**
 * Literal references are required — Next.js only inlines `process.env.X`
 * when X appears verbatim in the source.
 */
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
	// Server vars are undefined in the browser bundle, which is intentional —
	// accessing them client-side is a programming error, not a runtime value.
	...(server ?? ({} as z.infer<typeof serverSchema>)),
};
