"use client";

import { LifeBuoyIcon } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import {
	type ConversationListItem,
	getConversations,
} from "@/app/messages/actions";
import { startSupportConversation } from "@/app/messages/start.actions";
import { ChatPanel } from "@/components/messages/chat-panel";
import { ConversationList } from "@/components/messages/conversation-list";
import { Button } from "@/components/ui/button";
import { useOnlineStatuses } from "@/hooks/use-online-statuses";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { useTranslation } from "@/hooks/use-translation";
import { emitMessagesRead } from "@/lib/unread-events";
import { cn } from "@/lib/utils";

type Props = {
	myUserId: string;
	initialConversationId: string | null;
	canContactSupport: boolean;
};

export function MessagesView({
	myUserId,
	initialConversationId,
	canContactSupport,
}: Props) {
	const [conversations, setConversations] = useState<
		ConversationListItem[] | null
	>(null);
	const [selectedId, setSelectedId] = useState<string | null>(
		initialConversationId,
	);
	const [contacting, startContact] = useTransition();
	const t = useTranslation();

	usePresenceHeartbeat();

	const refreshConversations = useCallback(async () => {
		const result = await getConversations();
		if (result.ok) setConversations(result.data);
	}, []);

	useEffect(() => {
		void refreshConversations();
	}, [refreshConversations]);

	const conversationIds = useMemo(
		() => conversations?.map((c) => c.id) ?? [],
		[conversations],
	);
	useRealtimeConversations(conversationIds, () => {
		void refreshConversations();
	});

	const otherIds = useMemo(
		() =>
			(conversations ?? [])
				.map((c) => c.other?.id)
				.filter((id): id is string => !!id),
		[conversations],
	);
	const onlineStatuses = useOnlineStatuses(otherIds);

	const selected = useMemo(
		() => conversations?.find((c) => c.id === selectedId) ?? null,
		[conversations, selectedId],
	);

	const onMarkedAsRead = useCallback(() => {
		void refreshConversations();
		emitMessagesRead();
	}, [refreshConversations]);

	const onContactSupport = useCallback(() => {
		startContact(async () => {
			const result = await startSupportConversation();
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			await refreshConversations();
			setSelectedId(result.data.conversationId);
		});
	}, [refreshConversations]);

	return (
		<div className="grid h-full grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-2 md:grid-cols-[320px_1fr] md:p-3">
			<aside
				className={cn(
					"min-h-0 gap-3 border-border md:border-r md:pr-3",
					selectedId ? "hidden md:flex md:flex-col" : "flex flex-col",
				)}
			>
				{canContactSupport ? (
					<Button
						variant="outline"
						className="shrink-0 justify-center gap-2 border-[#d3b662]/30 hover:border-[#d3b662]/60 hover:bg-[#d3b662]/6"
						onClick={onContactSupport}
						disabled={contacting}
					>
						<LifeBuoyIcon className="size-4 text-brand-gold" />
						{contacting ? t("msgOpening") : t("msgContactSupport")}
					</Button>
				) : null}
				<div className="min-h-0 flex-1">
					<ConversationList
						conversations={conversations}
						selectedId={selectedId}
						onSelect={setSelectedId}
						onlineStatuses={onlineStatuses}
					/>
				</div>
			</aside>

			<section
				className={cn(
					"min-h-0",
					selectedId ? "flex flex-col" : "hidden md:flex md:flex-col",
				)}
			>
				{selected ? (
					<ChatPanel
						key={selected.id}
						conversationId={selected.id}
						myUserId={myUserId}
						other={selected.other}
						isSupport={selected.isSupport}
						isOtherOnline={
							selected.other ? !!onlineStatuses[selected.other.id] : false
						}
						onBack={() => setSelectedId(null)}
						onMarkedAsRead={onMarkedAsRead}
					/>
				) : (
					<div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
						{t("msgSelectConversation")}
					</div>
				)}
			</section>
		</div>
	);
}
