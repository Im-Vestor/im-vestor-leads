import { listSupportConversations } from "./actions";
import { SupportInbox } from "./support-inbox";

export default async function AdminSupportPage() {
	const result = await listSupportConversations();
	const items = result.ok ? result.data.items : [];
	const supportUserId = result.ok ? result.data.supportUserId : "";

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Support inbox</h1>
				<p className="text-sm text-muted-foreground">
					Messages users sent to Im-Vestor Support. Replies are sent as Support.
				</p>
			</div>
			<SupportInbox initialThreads={items} supportUserId={supportUserId} />
		</div>
	);
}
