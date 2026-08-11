"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { type AdminArea, addArea, removeArea } from "./actions";

export function AreasManager({ initialAreas }: { initialAreas: AdminArea[] }) {
	const t = useTranslation();
	const [areas, setAreas] = useState(initialAreas);
	const [name, setName] = useState("");
	const [isPending, startTransition] = useTransition();

	function onAdd(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (trimmed.length < 2 || isPending) return;
		startTransition(async () => {
			const result = await addArea({ name: trimmed });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			setAreas((prev) =>
				[...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)),
			);
			setName("");
			toast.success(t("adminAreaAdded"));
		});
	}

	function onRemove(area: AdminArea) {
		const inUse = area.projectCount + area.investorCount;
		if (inUse > 0 && !window.confirm(t("adminAreasRemoveWarning"))) return;
		startTransition(async () => {
			const result = await removeArea({ id: area.id });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			setAreas((prev) => prev.filter((a) => a.id !== area.id));
			toast.success(t("adminAreaRemoved"));
		});
	}

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:py-12">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					{t("adminAreasTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("adminAreasDescription")}
				</p>
			</div>

			<form onSubmit={onAdd} className="flex gap-2">
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("adminAreasAddPlaceholder")}
					maxLength={80}
				/>
				<Button
					type="submit"
					disabled={isPending || name.trim().length < 2}
					className="shrink-0"
				>
					<PlusIcon /> {t("adminAreasAdd")}
				</Button>
			</form>

			{areas.length === 0 ? (
				<p className="text-center text-muted-foreground text-sm">
					{t("adminAreasEmpty")}
				</p>
			) : (
				<ul className="flex flex-col divide-y rounded-lg border">
					{areas.map((area) => (
						<li
							key={area.id}
							className="flex items-center justify-between gap-3 px-3 py-2.5"
						>
							<div className="flex min-w-0 flex-col">
								<span className="truncate font-medium text-sm">
									{area.name}
								</span>
								<span className="text-muted-foreground text-xs">
									{area.projectCount} {t("adminAreasProjects")} ·{" "}
									{area.investorCount} {t("adminAreasInvestors")}
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onRemove(area)}
								disabled={isPending}
								aria-label={t("adminAreasRemove")}
							>
								<Trash2Icon className="size-4 text-destructive" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
