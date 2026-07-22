"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { BadgeCheckIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ConversationListItem } from "@/app/messages/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { getDisplayName } from "@/lib/messages/display-name";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

type Props = {
	conversations: ConversationListItem[] | null;
	selectedId: string | null;
	onSelect: (id: string) => void;
	onlineStatuses: Record<string, boolean>;
};

export function ConversationList({
	conversations,
	selectedId,
	onSelect,
	onlineStatuses,
}: Props) {
	const t = useTranslation();
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		if (!conversations) return null;
		const q = search.trim().toLowerCase();
		if (!q) return conversations;
		return conversations.filter((c) => {
			const name = getDisplayName(c.other).toLowerCase();
			return name.includes(q);
		});
	}, [conversations, search]);

	return (
		<div className="flex h-full flex-col gap-3">
			<div className="relative">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("msgSearchConversations")}
					className="pl-9"
				/>
			</div>

			<div className="flex-1 overflow-y-auto">
				{filtered === null ? (
					<div className="flex flex-col gap-2">
						{["a", "b", "c", "d", "e"].map((k) => (
							<Skeleton key={k} className="h-16 w-full rounded-lg" />
						))}
					</div>
				) : filtered.length === 0 ? (
					<div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
						{t("msgNoConversations")}
					</div>
				) : (
					<ul className="flex flex-col gap-1">
						{filtered.map((c) => {
							const name = getDisplayName(c.other);
							const isSelected = c.id === selectedId;
							const isOnline = c.other ? !!onlineStatuses[c.other.id] : false;
							const hasUnread = c.unreadCount > 0;
							return (
								<li key={c.id}>
									<button
										type="button"
										onClick={() => onSelect(c.id)}
										className={cn(
											"flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
											isSelected
												? c.isSupport
													? "bg-[#d3b662]/15 ring-1 ring-inset ring-[#d3b662]/40"
													: "bg-secondary"
												: "hover:bg-secondary/60",
											c.isSupport &&
												!isSelected &&
												"ring-1 ring-inset ring-[#d3b662]/20",
										)}
									>
										<UserAvatar
											name={name}
											isOnline={isOnline}
											support={c.isSupport}
											size="md"
										/>
										<div className="flex min-w-0 flex-1 flex-col">
											<div className="flex items-baseline justify-between gap-2">
												<span className="flex min-w-0 items-center gap-1">
													<span
														className={cn(
															"min-w-0 truncate text-sm",
															hasUnread
																? "font-semibold text-foreground"
																: "text-foreground",
														)}
													>
														{name}
													</span>
													{c.isSupport ? (
														<BadgeCheckIcon className="size-3.5 shrink-0 text-brand-gold" />
													) : null}
												</span>
												{c.lastMessage ? (
													<span className="shrink-0 text-[10px] text-muted-foreground">
														{formatDistanceToNowStrict(
															c.lastMessage.createdAt,
															{
																addSuffix: false,
															},
														)}
													</span>
												) : null}
											</div>
											<div className="flex min-w-0 items-center justify-between gap-2">
												<span
													className={cn(
														"min-w-0 truncate text-xs",
														hasUnread
															? "font-medium text-foreground"
															: "text-muted-foreground",
													)}
												>
													{c.lastMessage?.content ?? t("msgNoMessages")}
												</span>
												{hasUnread ? (
													<Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
														{c.unreadCount}
													</Badge>
												) : null}
											</div>
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
