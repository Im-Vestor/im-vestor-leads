"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ArrowLeftIcon, LifeBuoyIcon, SendIcon } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { MessageBubble } from "@/components/messages/message-bubble";
import { UserAvatar } from "@/components/messages/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useTranslation } from "@/hooks/use-translation";
import { getDisplayName } from "@/lib/messages/display-name";
import { emitSupportRead } from "@/lib/unread-events";
import { cn } from "@/lib/utils";
import {
	getSupportMessages,
	listSupportConversations,
	markSupportRead,
	replyAsSupport,
	type SupportMessage,
	type SupportThread,
} from "./actions";

type Props = {
	initialThreads: SupportThread[];
	supportUserId: string;
};

export function SupportInbox({ initialThreads, supportUserId }: Props) {
	const t = useTranslation();
	const [threads, setThreads] = useState<SupportThread[]>(initialThreads);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [messages, setMessages] = useState<SupportMessage[] | null>(null);
	const [draft, setDraft] = useState("");
	const [isSending, startSend] = useTransition();
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const refresh = useCallback(async () => {
		const result = await listSupportConversations();
		if (result.ok) setThreads(result.data.items);
	}, []);

	const open = useCallback(
		async (id: string) => {
			setSelectedId(id);
			setMessages(null);
			const result = await getSupportMessages({ conversationId: id });
			if (result.ok) {
				setMessages(result.data);
				await markSupportRead({ conversationId: id });
				emitSupportRead();
				void refresh();
			}
		},
		[refresh],
	);

	const threadIds = useMemo(() => threads.map((t) => t.id), [threads]);
	useRealtimeConversations(threadIds, () => {
		void refresh();
	});

	const onIncoming = useCallback(
		(row: {
			id: string;
			conversation_id: string;
			sender_id: string;
			content: string;
			created_at: string;
		}) => {
			setMessages((prev) => {
				if (!prev) return prev;
				if (prev.some((m) => m.id === row.id)) return prev;
				return [
					...prev,
					{
						id: row.id,
						content: row.content,
						createdAt: new Date(row.created_at),
						readAt: null,
						senderId: row.sender_id,
					},
				];
			});
			if (row.sender_id !== supportUserId) {
				void markSupportRead({ conversationId: row.conversation_id }).then(
					() => {
						emitSupportRead();
						return refresh();
					},
				);
			}
		},
		[supportUserId, refresh],
	);
	useRealtimeMessages(selectedId, onIncoming);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages?.length]);

	const selected = useMemo(
		() => threads.find((t) => t.id === selectedId) ?? null,
		[threads, selectedId],
	);

	const handleSend = useCallback(() => {
		const content = draft.trim();
		if (!content || !selectedId || isSending) return;
		startSend(async () => {
			setDraft("");
			const result = await replyAsSupport({
				conversationId: selectedId,
				content,
			});
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			setMessages((prev) => {
				if (!prev) return [result.data];
				if (prev.some((m) => m.id === result.data.id)) return prev;
				return [...prev, result.data];
			});
			void refresh();
		});
	}, [draft, selectedId, isSending, refresh]);

	const userName = getDisplayName(selected?.user);

	return (
		<div className="grid h-[calc(100dvh-14rem)] grid-cols-1 gap-4 md:h-[calc(100dvh-220px)] md:grid-cols-[320px_1fr]">
			<Card className={cn("min-h-0", selected && "hidden md:flex")}>
				<CardContent className="flex h-full flex-col gap-1 overflow-y-auto p-2">
					{threads.length === 0 ? (
						<div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
							{t("adminSupportNoConversations")}
						</div>
					) : (
						threads.map((thread) => {
							const name = getDisplayName(thread.user);
							const isSelected = thread.id === selectedId;
							const hasUnread = thread.unreadCount > 0;
							return (
								<button
									key={thread.id}
									type="button"
									onClick={() => open(thread.id)}
									className={cn(
										"flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent",
										isSelected && "bg-accent",
									)}
								>
									<UserAvatar name={name} size="md" />
									<div className="flex min-w-0 flex-1 flex-col">
										<div className="flex items-baseline justify-between gap-2">
											<span
												className={cn(
													"truncate text-sm",
													hasUnread && "font-semibold",
												)}
											>
												{name}
											</span>
											{thread.lastMessage ? (
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{formatDistanceToNowStrict(
														thread.lastMessage.createdAt,
													)}
												</span>
											) : null}
										</div>
										<div className="flex items-center justify-between gap-2">
											<span
												className={cn(
													"truncate text-xs",
													hasUnread
														? "font-medium text-foreground"
														: "text-muted-foreground",
												)}
											>
												{thread.lastMessage?.content ??
													t("adminSupportNoMessagesPreview")}
											</span>
											{hasUnread ? (
												<Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
													{thread.unreadCount}
												</Badge>
											) : null}
										</div>
									</div>
								</button>
							);
						})
					)}
				</CardContent>
			</Card>

			<Card className={cn("min-h-0", !selected && "hidden md:flex")}>
				<CardContent className="flex h-full flex-col p-0">
					{!selected ? (
						<div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
							<LifeBuoyIcon className="size-6" />
							{t("adminSupportSelectConversation")}
						</div>
					) : (
						<>
							<div className="flex items-center gap-3 border-b border-border px-3 py-3 md:px-4">
								<Button
									variant="ghost"
									size="icon"
									className="-ml-1 shrink-0 md:hidden"
									aria-label={t("commonBack")}
									onClick={() => {
										setSelectedId(null);
										setMessages(null);
									}}
								>
									<ArrowLeftIcon className="size-5" />
								</Button>
								<UserAvatar name={userName} size="md" />
								<div className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium">
										{userName}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{selected.user?.email}
									</span>
								</div>
							</div>

							<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
								{messages === null ? (
									<div className="flex flex-col gap-3">
										{["a", "b", "c", "d"].map((k) => (
											<Skeleton key={k} className="h-12 w-2/3 rounded-2xl" />
										))}
									</div>
								) : messages.length === 0 ? (
									<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
										{t("adminSupportEmptyThread")}
									</div>
								) : (
									<div className="flex flex-col gap-3">
										{messages.map((m) => (
											<MessageBubble
												key={m.id}
												content={m.content}
												createdAt={m.createdAt}
												isOwn={m.senderId === supportUserId}
												senderName={userName}
											/>
										))}
									</div>
								)}
							</div>

							<div className="border-t border-border p-3">
								<div className="flex items-end gap-2">
									<Textarea
										value={draft}
										onChange={(e) => setDraft(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handleSend();
											}
										}}
										rows={1}
										placeholder={t("adminSupportReplyPlaceholder")}
										className="max-h-40 min-h-10 resize-none"
									/>
									<Button
										size="icon"
										className="size-11 shrink-0 md:size-10"
										onClick={handleSend}
										disabled={isSending || draft.trim().length === 0}
									>
										<SendIcon className="size-4" />
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
