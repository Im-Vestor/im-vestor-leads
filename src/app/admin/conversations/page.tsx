import { listAllConversations, listBannedWords } from "./actions";
import { AdminConversationsView } from "./conversations-view";

export default async function AdminConversationsPage() {
	const [convosResult, wordsResult] = await Promise.all([
		listAllConversations({}),
		listBannedWords(),
	]);

	return (
		<div>
			<h1 className="mb-6 text-2xl font-bold">Conversations moderation</h1>
			<AdminConversationsView
				initialConversations={convosResult.ok ? convosResult.data.items : []}
				initialBannedWords={wordsResult.ok ? wordsResult.data : []}
			/>
		</div>
	);
}
