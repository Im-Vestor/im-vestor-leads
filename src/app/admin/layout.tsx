import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const admin = await requireAdmin();
	if (!admin) redirect("/");

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-8">
			<AdminNav />
			<div className="mt-6">{children}</div>
		</div>
	);
}
