"use client";

import {
	HandIcon,
	MinusIcon,
	PlusIcon,
	SearchIcon,
	TicketIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/generated/prisma/enums";
import { useTranslation } from "@/hooks/use-translation";
import { ROLE_LABEL_KEYS } from "@/lib/constants";
import { getDisplayName } from "@/lib/messages/display-name";
import { type AdminUserRow, adjustBalance, listUsers } from "./actions";

export function UsersManager({
	initialUsers,
}: {
	initialUsers: AdminUserRow[];
}) {
	const t = useTranslation();
	const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const q = search.trim();
		let cancelled = false;
		const handle = window.setTimeout(async () => {
			setLoading(true);
			const result = await listUsers({ search: q });
			if (cancelled) return;
			if (result.ok) setUsers(result.data);
			else toast.error(result.error);
			setLoading(false);
		}, 300);
		return () => {
			cancelled = true;
			window.clearTimeout(handle);
		};
	}, [search]);

	const onUpdated = (row: AdminUserRow) =>
		setUsers((prev) => prev.map((u) => (u.id === row.id ? row : u)));

	return (
		<div className="flex flex-col gap-4">
			<div className="relative max-w-sm">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("adminUsersSearchPlaceholder")}
					className="pl-9"
				/>
			</div>

			<div className="overflow-x-auto rounded-lg border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("adminUsersColUser")}</TableHead>
							<TableHead>{t("adminUsersColRole")}</TableHead>
							<TableHead className="text-center">
								{t("adminUsersColPokes")}
							</TableHead>
							<TableHead className="text-center">
								{t("adminUsersColCredits")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							["a", "b", "c", "d", "e"].map((k) => (
								<TableRow key={k}>
									<TableCell colSpan={4}>
										<Skeleton className="h-9 w-full" />
									</TableCell>
								</TableRow>
							))
						) : users.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-10 text-center text-muted-foreground text-sm"
								>
									{t("adminUsersNoResults")}
								</TableCell>
							</TableRow>
						) : (
							users.map((u) => (
								<TableRow key={u.id}>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">{getDisplayName(u)}</span>
											<span className="text-muted-foreground text-xs">
												{u.email}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">
											{t(ROLE_LABEL_KEYS[u.role as UserRole])}
										</Badge>
									</TableCell>
									<TableCell>
										<BalanceControl
											user={u}
											field="pokes"
											icon={<HandIcon className="size-3.5 text-brand-gold" />}
											onUpdated={onUpdated}
										/>
									</TableCell>
									<TableCell>
										<BalanceControl
											user={u}
											field="leadCredits"
											icon={<TicketIcon className="size-3.5 text-brand-gold" />}
											onUpdated={onUpdated}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function BalanceControl({
	user,
	field,
	icon,
	onUpdated,
}: {
	user: AdminUserRow;
	field: "pokes" | "leadCredits";
	icon: React.ReactNode;
	onUpdated: (row: AdminUserRow) => void;
}) {
	const t = useTranslation();
	const [amount, setAmount] = useState("1");
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	const apply = (sign: 1 | -1) => {
		const magnitude = Math.trunc(Math.abs(Number(amount)));
		if (!Number.isFinite(magnitude) || magnitude < 1) {
			toast.error(t("adminUsersInvalidAmount"));
			inputRef.current?.focus();
			return;
		}
		startTransition(async () => {
			const result = await adjustBalance({
				userId: user.id,
				field,
				delta: sign * magnitude,
			});
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			onUpdated(result.data);
			toast.success(t("adminUsersUpdated"));
		});
	};

	return (
		<div className="flex items-center justify-center gap-1.5">
			<span className="inline-flex min-w-12 items-center justify-end gap-1 font-semibold tabular-nums">
				{icon}
				{user[field]}
			</span>
			<Button
				type="button"
				size="icon-sm"
				variant="outline"
				disabled={isPending}
				title={t("adminUsersRemove")}
				aria-label={t("adminUsersRemove")}
				onClick={() => apply(-1)}
			>
				<MinusIcon className="size-3.5" />
			</Button>
			<Input
				ref={inputRef}
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
				inputMode="numeric"
				aria-label={t("adminUsersAmount")}
				className="h-8 w-14 text-center"
			/>
			<Button
				type="button"
				size="icon-sm"
				variant="outline"
				disabled={isPending}
				title={t("adminUsersAdd")}
				aria-label={t("adminUsersAdd")}
				onClick={() => apply(1)}
			>
				<PlusIcon className="size-3.5" />
			</Button>
		</div>
	);
}
