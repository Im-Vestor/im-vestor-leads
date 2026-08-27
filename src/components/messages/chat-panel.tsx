"use client";

import {
	ArrowLeftIcon,
	BadgeCheckIcon,
	LockIcon,
	SendIcon,
	UnlockIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useOptimistic,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { unlockInvestor, unlockProject } from "@/app/dashboard/actions";
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
import { useTranslation } from "@/hooks/use-translation";
import { getDisplayName } from "@/lib/messages/display-name";
import type { PresenceStatus } from "@/lib/messages/presence";
import { MessageBubble } from "./message-bubble";
import { presenceLabelKey } from "./presence-dot";
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
	myRole: string;
	other: OtherUser;
	isSupport?: boolean;
	otherPresence: PresenceStatus;
	locked: boolean;
	projectId: string | null;
	onBack?: () => void;
	onMarkedAsRead?: () => void;
	onUnlocked?: () => void;
};

export function ChatPanel({
	conversationId,
	myUserId,
	myRole,
	other,
	isSupport,
	otherPresence,
	locked,
	projectId,
	onBack,
	onMarkedAsRead,
	onUnlocked,
}: Props) {
	const t = useTranslation();
	const router = useRouter();
	const [messages, setMessages] = useState<MessageItem[] | null>(null);
	const [draft, setDraft] = useState("");
	const [isPending, startTransition] = useTransition();
	const [unlocking, startUnlock] = useTransition();
	const scrollRef = useRef<HTMLDivElement | null>(null);
	// Ids of messages this client already appended (via optimistic send or a
	// prior realtime insert) so a duplicate realtime echo is ignored.
	const seenIdsRef = useRef<Set<string>>(new Set());

	const [optimisticMessages, addOptimistic] = useOptimistic(
		messages ?? [],
		(state: MessageItem[], pending: MessageItem) => {
			// If the real message already landed (via the send response or a
			// realtime echo) while this transition was still pending, don't render
			// the optimistic copy on top of it.
			const alreadyLanded = state.some(
				(m) =>
					m.senderId === pending.senderId &&
					m.content === pending.content &&
					m.createdAt.getTime() >= pending.createdAt.getTime() - 5000,
			);
			if (alreadyLanded) return state;
			return [...state, pending];
		},
	);

	useEffect(() => {
		if (locked) return;
		let cancelled = false;
		setMessages(null);
		seenIdsRef.current = new Set();
		const load = async () => {
			const result = await getMessages({ conversationId });
			if (cancelled) return;
			if (result.ok) {
				for (const m of result.data.messages) seenIdsRef.current.add(m.id);
				setMessages(result.data.messages);
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [conversationId, locked]);

	useEffect(() => {
		if (!conversationId) return;
		// Runs for locked chats too, so window-era unread can still be cleared —
		// otherwise the global unread badge would stick with no way to open them.
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

	const handleUnlock = useCallback(() => {
		if (unlocking) return;
		startUnlock(async () => {
			const result =
				myRole === "ENTREPRENEUR"
					? other
						? await unlockInvestor(other.id)
						: { ok: false as const, error: t("errForbidden") }
					: projectId
						? await unlockProject(projectId)
						: { ok: false as const, error: t("errForbidden") };
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			toast.success(t("dashLeadUnlocked"));
			onUnlocked?.();
			router.refresh();
		});
	}, [myRole, other, projectId, unlocking, onUnlocked, router, t]);

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
			if (seenIdsRef.current.has(row.id)) return;
			seenIdsRef.current.add(row.id);
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
			seenIdsRef.current.add(result.data.id);
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
					presence={otherPresence}
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
						{isSupport ? "Support team" : t(presenceLabelKey[otherPresence])}
					</span>
				</div>
			</div>

			{locked ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
					<LockIcon className="size-8 text-muted-foreground" />
					<div>
						<p className="font-medium text-sm">{t("msgChatLockedTitle")}</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{t("msgChatLockedDesc")}
						</p>
					</div>
					<Button onClick={handleUnlock} disabled={unlocking}>
						<UnlockIcon className="size-4" /> {t("msgUnlockLead")}
					</Button>
				</div>
			) : (
				<>
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
				</>
			)}
		</div>
	);
}
