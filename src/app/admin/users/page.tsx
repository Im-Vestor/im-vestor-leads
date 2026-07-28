import { getT } from "@/utils/translations/server";
import { listUsers } from "./actions";
import { UsersManager } from "./users-manager";

export default async function AdminUsersPage() {
	const t = await getT();
	const result = await listUsers();
	const users = result.ok ? result.data : [];

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold">{t("adminUsersTitle")}</h1>
				<p className="text-sm text-muted-foreground">
					{t("adminUsersSubtitle")}
				</p>
			</div>
			<UsersManager initialUsers={users} />
		</div>
	);
}
