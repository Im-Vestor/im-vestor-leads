"use client";

import { HandIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

/**
 * How many pokes the current user has left to spend. Doubles as a shortcut to
 * the shop when they run out.
 */
export function PokeBalance({
	pokes,
	className,
}: {
	pokes: number;
	className?: string;
}) {
	const t = useTranslation();
	const out = pokes < 1;

	return (
		<Link
			href="/shop"
			title={out ? t("pokeNoneLeft") : t("pokeBalanceHint")}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
				out
					? "border-destructive/40 text-destructive hover:bg-destructive/10"
					: "border-border bg-secondary/50 text-foreground hover:bg-secondary",
				className,
			)}
		>
			<HandIcon className="size-3.5 text-brand-gold" />
			<span className="font-semibold tabular-nums">{pokes}</span>
			<span className="text-muted-foreground">{t("pokeBalanceLabel")}</span>
		</Link>
	);
}
