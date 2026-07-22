import { getT } from "@/utils/translations/server";
import { listAllConversations, listBannedWords } from "./actions";
import { AdminConversationsView } from "./conversations-view";

export default async function AdminConversationsPage() {
	const t = await getT();
	const [convosResult, wordsResult] = await Promise.all([
		listAllConversations({}),
		listBannedWords(),
	]);

	return (
		<div className="mx-auto w-full max-w-content px-4 py-6 md:py-8">
			<h1 className="mb-6 text-2xl font-bold">
				{t("adminConversationsPageTitle")}
			</h1>
			<AdminConversationsView
				initialConversations={convosResult.ok ? convosResult.data.items : []}
				initialBannedWords={wordsResult.ok ? wordsResult.data : []}
			/>
		</div>
	);
}
