import { getT } from "@/utils/translations/server";
import { listSupportConversations } from "./actions";
import { SupportInbox } from "./support-inbox";

export default async function AdminSupportPage() {
	const t = await getT();
	const result = await listSupportConversations();
	const items = result.ok ? result.data.items : [];
	const supportUserId = result.ok ? result.data.supportUserId : "";

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold">{t("adminSupportPageTitle")}</h1>
				<p className="text-sm text-muted-foreground">
					{t("adminSupportPageSubtitle")}
				</p>
			</div>
			<SupportInbox initialThreads={items} supportUserId={supportUserId} />
		</div>
	);
}
