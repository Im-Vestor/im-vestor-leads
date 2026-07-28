"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
	BellIcon,
	CheckCheckIcon,
	CircleSlashIcon,
	CrownIcon,
	HandIcon,
	HandshakeIcon,
	LifeBuoyIcon,
	type LucideIcon,
	MessageSquareIcon,
	RefreshCwIcon,
	RocketIcon,
	ShoppingBagIcon,
	SparklesIcon,
	TriangleAlertIcon,
	UnlockIcon,
	UsersIcon,
	XCircleIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { NotificationItem } from "@/app/messages/notifications.actions";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { NotificationType, PokeStatus } from "@/generated/prisma/enums";
import { useNotifications } from "@/hooks/use-notifications";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/utils/translations";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
	MESSAGE_RECEIVED: MessageSquareIcon,
	POKE_RECEIVED: HandIcon,
	POKE_ACCEPTED: HandshakeIcon,
	POKE_REJECTED: CircleSlashIcon,
	SUPPORT_REPLY: LifeBuoyIcon,
	WELCOME: SparklesIcon,
	REFERRAL_JOINED: UsersIcon,
	PROJECT_PUBLISHED: RocketIcon,
	LEAD_UNLOCKED: UnlockIcon,
	HYPERTRAIN_ACTIVATED: ZapIcon,
	PURCHASE_COMPLETED: ShoppingBagIcon,
	SUBSCRIPTION_STARTED: CrownIcon,
	SUBSCRIPTION_RENEWED: RefreshCwIcon,
	SUBSCRIPTION_CANCELLED: XCircleIcon,
	PAYMENT_FAILED: TriangleAlertIcon,
};

const TYPE_TITLE_KEYS: Record<NotificationType, TranslationKey> = {
	MESSAGE_RECEIVED: "notifMessageReceived",
	POKE_RECEIVED: "notifPokeReceived",
	POKE_ACCEPTED: "notifPokeAccepted",
	POKE_REJECTED: "notifPokeRejected",
	SUPPORT_REPLY: "notifSupportReply",
	WELCOME: "notifWelcome",
	REFERRAL_JOINED: "notifReferralJoined",
	PROJECT_PUBLISHED: "notifProjectPublished",
	LEAD_UNLOCKED: "notifLeadUnlocked",
	HYPERTRAIN_ACTIVATED: "notifHypertrainActivated",
	PURCHASE_COMPLETED: "notifPurchaseCompleted",
	SUBSCRIPTION_STARTED: "notifSubscriptionStarted",
	SUBSCRIPTION_RENEWED: "notifSubscriptionRenewed",
	SUBSCRIPTION_CANCELLED: "notifSubscriptionCancelled",
	PAYMENT_FAILED: "notifPaymentFailed",
};

/** Payment failure is the one row that should read as a problem, not news. */
const ALERT_TYPES: NotificationType[] = [
	"PAYMENT_FAILED",
	"SUBSCRIPTION_CANCELLED",
];

export const NotificationBell = ({ userId }: { userId: string | null }) => {
	const t = useTranslation();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const { items, unreadCount, loading, markOneRead, markAllRead, answerPoke } =
		useNotifications(userId);

	const badge = unreadCount > 99 ? "99+" : String(unreadCount);

	/** Accepting is the moment the two are allowed to talk, so it hands the
	 * conversation straight over instead of leaving it to be found. */
	const onAnswerPoke = async (pokeId: string, action: "accept" | "reject") => {
		const result = await answerPoke(pokeId, action);
		if (!result.ok) {
			if (result.error) toast.error(result.error);
			return;
		}
		if (result.data.conversationId) {
			toast.success(t("pokeAcceptedToast"));
			setOpen(false);
			router.push(`/messages?c=${result.data.conversationId}`);
			return;
		}
		toast.success(t("pokeRejectedToast"));
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label={
							unreadCount > 0
								? `${t("notificationsTitle")} (${badge})`
								: t("notificationsTitle")
						}
						className="relative"
					/>
				}
			>
				<BellIcon className="size-5" />
				{unreadCount > 0 ? (
					<span
						aria-hidden
						className="-top-0.5 -right-0.5 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-deep px-1 font-semibold text-[10px] text-black leading-none"
					>
						{badge}
					</span>
				) : null}
			</PopoverTrigger>

			<PopoverContent
				align="end"
				sideOffset={10}
				className="w-[min(22rem,calc(100vw-2rem))] gap-0 border border-white/10 bg-[#0b0820]/95 p-0 backdrop-blur-md"
			>
				<div className="flex items-center justify-between gap-2 border-white/10 border-b px-4 py-3">
					<span className="font-medium text-sm">{t("notificationsTitle")}</span>
					{unreadCount > 0 ? (
						<button
							type="button"
							onClick={() => void markAllRead()}
							className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-gold"
						>
							<CheckCheckIcon className="size-3.5" />
							{t("notificationsMarkAllRead")}
						</button>
					) : null}
				</div>

				{items.length === 0 ? (
					<EmptyState loading={loading} label={t("notificationsEmpty")} />
				) : (
					<ul className="max-h-[min(26rem,60vh)] overflow-y-auto">
						{items.map((item) => (
							<NotificationRow
								key={item.id}
								item={item}
								title={t(TYPE_TITLE_KEYS[item.type])}
								onAnswerPoke={onAnswerPoke}
								onOpen={() => {
									void markOneRead(item.id);
									setOpen(false);
								}}
							/>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
};

const EmptyState = ({
	loading,
	label,
}: {
	loading: boolean;
	label: string;
}) => (
	<div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
		<BellIcon className="size-6 text-muted-foreground/60" />
		<p className="text-muted-foreground text-xs">{loading ? "…" : label}</p>
	</div>
);

/** Accept / reject, shown only while the request is still open. */
const PokeActions = ({
	pokeId,
	onAnswer,
}: {
	pokeId: string;
	onAnswer: (pokeId: string, action: "accept" | "reject") => Promise<void>;
}) => {
	const t = useTranslation();
	const [isPending, startTransition] = useTransition();

	const answer = (action: "accept" | "reject") => {
		startTransition(async () => {
			await onAnswer(pokeId, action);
		});
	};

	return (
		<div className="mt-2 flex gap-2">
			<Button
				size="sm"
				className="h-7 px-3 text-xs"
				disabled={isPending}
				onClick={() => answer("accept")}
			>
				{t("pokeAccept")}
			</Button>
			<Button
				size="sm"
				variant="outline"
				className="h-7 px-3 text-xs"
				disabled={isPending}
				onClick={() => answer("reject")}
			>
				{t("pokeReject")}
			</Button>
		</div>
	);
};

/** PENDING is absent on purpose: an open request gets buttons, not a label. */
const POKE_OUTCOME_KEYS: Partial<Record<PokeStatus, TranslationKey>> = {
	ACCEPTED: "pokeStatusAccepted",
	REJECTED: "pokeStatusRejected",
	EXPIRED: "pokeStatusExpired",
};

const NotificationRow = ({
	item,
	title,
	onOpen,
	onAnswerPoke,
}: {
	item: NotificationItem;
	title: string;
	onOpen: () => void;
	onAnswerPoke: (pokeId: string, action: "accept" | "reject") => Promise<void>;
}) => {
	const t = useTranslation();
	const Icon = TYPE_ICONS[item.type];
	const isAlert = ALERT_TYPES.includes(item.type);
	const detail = item.senderName
		? item.message
			? `${item.senderName}: ${item.message}`
			: item.senderName
		: item.message;

	// A request still waiting on this user is the only row that acts in place.
	const openPoke =
		item.type === "POKE_RECEIVED" && item.poke?.status === "PENDING"
			? item.poke
			: null;
	// Once answered, the row says how it ended instead of offering buttons.
	const outcomeKey =
		item.type === "POKE_RECEIVED" && item.poke && !openPoke
			? POKE_OUTCOME_KEYS[item.poke.status]
			: undefined;

	const inner = (
		<>
			<span
				className={cn(
					"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
					isAlert
						? "bg-destructive/15 text-destructive"
						: "bg-gold/10 text-gold",
				)}
			>
				<Icon className="size-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="flex items-baseline justify-between gap-2">
					<span className="truncate font-medium text-sm">{title}</span>
					<span className="shrink-0 text-[10px] text-muted-foreground">
						{formatDistanceToNowStrict(new Date(item.createdAt), {
							addSuffix: false,
						})}
					</span>
				</span>
				{detail ? (
					<span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs">
						{detail}
					</span>
				) : null}
				{outcomeKey ? (
					<span className="mt-1 block text-[10px] text-muted-foreground uppercase tracking-wide">
						{t(outcomeKey)}
					</span>
				) : null}
			</span>
			{!item.read ? (
				<span
					aria-hidden
					className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
				/>
			) : null}
		</>
	);

	const className = cn(
		"flex w-full items-start gap-3 border-white/5 border-b px-4 py-3 text-left transition-colors last:border-b-0",
		item.read ? "hover:bg-white/5" : "bg-gold/[0.04] hover:bg-gold/[0.08]",
	);

	// Buttons cannot nest inside a button, so an actionable poke drops the
	// clickable wrapper entirely — the answer *is* the interaction.
	if (openPoke) {
		return (
			<li>
				<div className={cn(className, "cursor-default flex-col")}>
					<div className="flex w-full items-start gap-3">{inner}</div>
					<div className="w-full pl-11">
						<PokeActions pokeId={openPoke.id} onAnswer={onAnswerPoke} />
					</div>
				</div>
			</li>
		);
	}

	if (!item.link) {
		return (
			<li>
				<button type="button" onClick={onOpen} className={className}>
					{inner}
				</button>
			</li>
		);
	}

	return (
		<li>
			<Link href={item.link} onClick={onOpen} className={className}>
				{inner}
			</Link>
		</li>
	);
};
