"use client";

import { ArrowLeftIcon, BadgeCheckIcon, SendIcon } from "lucide-react";
import {
	useCallback,
	useEffect,
	useOptimistic,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import {
	getMessages,
	type MessageItem,
	markAsRead,
	sendMessage,
} from "@/app/messages/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { getDisplayName } from "@/lib/messages/display-name";
import { MessageBubble } from "./message-bubble";
import { UserAvatar } from "./user-avatar";

type OtherUser = {
	id: string;
	name: string | null;
	email: string;
	role: string;
} | null;

type Props = {
	conversationId: string;
	myUserId: string;
	other: OtherUser;
	isSupport?: boolean;
	isOtherOnline: boolean;
	onBack?: () => void;
	onMarkedAsRead?: () => void;
};

export function ChatPanel({
	conversationId,
	myUserId,
	other,
	isSupport,
	isOtherOnline,
	onBack,
	onMarkedAsRead,
}: Props) {
	const [messages, setMessages] = useState<MessageItem[] | null>(null);
	const [draft, setDraft] = useState("");
	const [isPending, startTransition] = useTransition();
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const [optimisticMessages, addOptimistic] = useOptimistic(
		messages ?? [],
		(state: MessageItem[], pending: MessageItem) => [...state, pending],
	);

	useEffect(() => {
		let cancelled = false;
		setMessages(null);
		const load = async () => {
			const result = await getMessages({ conversationId });
			if (cancelled) return;
			if (result.ok) setMessages(result.data.messages);
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [conversationId]);

	useEffect(() => {
		if (!conversationId) return;
		let cancelled = false;
		const run = async () => {
			const result = await markAsRead({ conversationId });
			if (!cancelled && result.ok && result.data.count > 0) {
				onMarkedAsRead?.();
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [conversationId, onMarkedAsRead]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [optimisticMessages.length]);

	const onIncoming = useCallback(
		(row: {
			id: string;
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
			if (row.sender_id !== myUserId) {
				void markAsRead({ conversationId }).then((r) => {
					if (r.ok && r.data.count > 0) onMarkedAsRead?.();
				});
			}
		},
		[conversationId, myUserId, onMarkedAsRead],
	);

	useRealtimeMessages(conversationId, onIncoming);

	const handleSend = useCallback(() => {
		const content = draft.trim();
		if (!content || isPending) return;
		const tempId = `optimistic-${Date.now()}`;
		startTransition(async () => {
			addOptimistic({
				id: tempId,
				content,
				createdAt: new Date(),
				readAt: null,
				senderId: myUserId,
			});
			setDraft("");
			const result = await sendMessage({ conversationId, content });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			setMessages((prev) => {
				if (!prev) return [result.data];
				if (prev.some((m) => m.id === result.data.id)) return prev;
				return [...prev, result.data];
			});
		});
	}, [addOptimistic, conversationId, draft, isPending, myUserId]);

	const otherName = getDisplayName(other);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-3 border-b border-border px-4 py-3">
				{onBack ? (
					<Button
						variant="ghost"
						size="icon-lg"
						aria-label="Back"
						className="md:hidden"
						onClick={onBack}
					>
						<ArrowLeftIcon className="size-4" />
					</Button>
				) : null}
				<UserAvatar
					name={otherName}
					isOnline={isOtherOnline}
					support={isSupport}
					size="md"
				/>
				<div className="flex flex-col">
					<span className="flex items-center gap-1 text-sm font-medium">
						{otherName}
						{isSupport ? (
							<BadgeCheckIcon className="size-3.5 text-brand-gold" />
						) : null}
					</span>
					<span className="text-xs text-muted-foreground">
						{isSupport
							? "Support team"
							: isOtherOnline
								? "Online"
								: (other?.role ?? "")}
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
				) : optimisticMessages.length === 0 ? (
					<div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
						No messages yet — say hi.
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{optimisticMessages.map((m) => (
							<MessageBubble
								key={m.id}
								content={m.content}
								createdAt={m.createdAt}
								isOwn={m.senderId === myUserId}
								senderName={otherName}
								senderIsSupport={isSupport}
							/>
						))}
					</div>
				)}
			</div>

			<div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
						placeholder="Type a message…"
						className="max-h-40 min-h-10 resize-none"
					/>
					<Button
						size="icon-lg"
						onClick={handleSend}
						disabled={isPending || draft.trim().length === 0}
					>
						<SendIcon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
