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
		<div className="mx-auto h-[calc(100dvh-9.5rem)] w-full max-w-content px-4 md:h-[calc(100vh-180px)]">
			<MessagesView
				myUserId={user.id}
				initialConversationId={sp.c ?? null}
				canContactSupport={user.role !== UserRole.ADMIN}
			/>
		</div>
	);
}
