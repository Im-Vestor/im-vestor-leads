import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
	const key = env.SUPABASE_SECRET_KEY;
	if (!key) {
		throw new Error(
			"SUPABASE_SECRET_KEY is not set. Fill it in .env before uploading project media.",
		);
	}
	if (!admin) {
		admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
			auth: { persistSession: false },
		});
	}
	return admin;
}

export const PROJECT_MEDIA_BUCKET = "project-media";
