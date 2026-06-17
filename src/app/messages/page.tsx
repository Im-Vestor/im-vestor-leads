import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { getOrCreateUser } from "@/lib/user";
import { MessagesView } from "./messages-view";

type Search = Promise<{ c?: string }>;

export default async function MessagesPage({
	searchParams,
}: {
	searchParams: Search;
}) {
	const user = await getOrCreateUser();
	if (!user) redirect("/sign-in");

	const sp = await searchParams;
	return (
		<div className="mx-auto h-[calc(100vh-180px)] w-full max-w-6xl px-4">
			<MessagesView
				myUserId={user.id}
				initialConversationId={sp.c ?? null}
				canContactSupport={user.role !== UserRole.ADMIN}
			/>
		</div>
	);
}
