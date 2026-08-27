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
import { usePresenceStatuses } from "@/hooks/use-presence-statuses";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { useTranslation } from "@/hooks/use-translation";
import { emitMessagesRead } from "@/lib/unread-events";
import { cn } from "@/lib/utils";

type Props = {
	myUserId: string;
	myRole: string;
	initialConversationId: string | null;
	canContactSupport: boolean;
};

export function MessagesView({
	myUserId,
	myRole,
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
	const onIncomingListMessage = useCallback(
		(row: {
			id: string;
			conversation_id: string;
			sender_id: string;
			content: string;
			created_at: string;
		}) => {
			setConversations((prev) => {
				if (!prev) return prev;
				const idx = prev.findIndex((c) => c.id === row.conversation_id);
				// New conversation we don't know about yet → full refresh to fetch it.
				if (idx === -1) {
					void refreshConversations();
					return prev;
				}
				const target = prev[idx];
				if (!target || target.lastMessage?.id === row.id) return prev;
				const fromOther = row.sender_id !== myUserId;
				const isOpen = row.conversation_id === selectedId;
				const updated: ConversationListItem = {
					...target,
					updatedAt: new Date(row.created_at),
					lastMessage: {
						id: row.id,
						content: row.content,
						createdAt: new Date(row.created_at),
						senderId: row.sender_id,
					},
					// Don't bump unread for the open thread (ChatPanel marks it read)
					// or for my own messages.
					unreadCount:
						fromOther && !isOpen
							? target.unreadCount + 1
							: target.unreadCount,
				};
				const next = [...prev];
				next.splice(idx, 1);
				next.unshift(updated);
				return next;
			});
		},
		[myUserId, selectedId, refreshConversations],
	);
	useRealtimeConversations(conversationIds, onIncomingListMessage);

	const otherIds = useMemo(
		() =>
			(conversations ?? [])
				.map((c) => c.other?.id)
				.filter((id): id is string => !!id),
		[conversations],
	);
	const presenceStatuses = usePresenceStatuses(otherIds);

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
						presenceStatuses={presenceStatuses}
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
						myRole={myRole}
						other={selected.other}
						isSupport={selected.isSupport}
						locked={selected.locked}
						projectId={selected.projectId}
						otherPresence={
							selected.other
								? (presenceStatuses[selected.other.id] ?? "offline")
								: "offline"
						}
						onBack={() => setSelectedId(null)}
						onMarkedAsRead={onMarkedAsRead}
						onUnlocked={refreshConversations}
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
