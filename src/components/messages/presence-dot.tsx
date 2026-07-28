"use client";

import { CheckIcon, ClockIcon } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { PresenceStatus } from "@/lib/messages/presence";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/utils/translations";

type Size = "sm" | "md" | "lg";

const dotClass: Record<Size, string> = {
	sm: "size-2.5",
	md: "size-3",
	lg: "size-3.5",
};

const glyphClass: Record<Size, string> = {
	sm: "size-1.5",
	md: "size-2",
	lg: "size-2.5",
};

const statusClass: Record<PresenceStatus, string> = {
	online: "bg-emerald-500 text-white",
	away: "bg-amber-400 text-black",
	offline: "bg-card text-transparent ring-2 ring-inset ring-muted-foreground",
};

export const presenceLabelKey: Record<PresenceStatus, TranslationKey> = {
	online: "presenceOnline",
	away: "presenceAway",
	offline: "presenceOffline",
};

type Props = {
	status: PresenceStatus;
	size?: Size;
	className?: string;
};

export function PresenceDot({ status, size = "md", className }: Props) {
	const t = useTranslation();
	const label = t(presenceLabelKey[status]);

	return (
		<span
			role="img"
			aria-label={label}
			title={label}
			className={cn(
				"flex items-center justify-center rounded-full border-2 border-card",
				dotClass[size],
				statusClass[status],
				className,
			)}
		>
			{status === "online" ? (
				<CheckIcon className={glyphClass[size]} strokeWidth={5} />
			) : status === "away" ? (
				<ClockIcon className={glyphClass[size]} strokeWidth={3.5} />
			) : null}
		</span>
	);
}
