import "server-only";
import { getOrCreateUser } from "@/lib/user";

export async function requireEntrepreneur() {
	const user = await getOrCreateUser();
	if (!user) return null;
	if (user.role !== "ENTREPRENEUR" && user.role !== "ADMIN") return null;
	return user;
}
