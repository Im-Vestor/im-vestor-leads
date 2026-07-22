"use client";

import { Loader2Icon, TrainFrontIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyHypertrainToProject } from "@/app/shop/hypertrain.actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

export function HypertrainButton({
	projectId,
	activeUntil,
	tickets,
	published,
	size,
	className,
}: {
	projectId: string;
	activeUntil: string | null;
	tickets: number;
	published: boolean;
	size?: "sm" | "default";
	className?: string;
}) {
	const t = useTranslation();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const active = activeUntil !== null && new Date(activeUntil) > new Date();

	function apply() {
		startTransition(async () => {
			const result = await applyHypertrainToProject(projectId);
			if (result.ok) {
				toast.success(t("hyperApplied"));
				setConfirmOpen(false);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	if (active) {
		return (
			<Button
				disabled
				size={size}
				className={`animate-pulse bg-purple-600 text-white disabled:opacity-100 ${className ?? ""}`}
			>
				<TrainFrontIcon /> {t("hyperActive")}
			</Button>
		);
	}

	return (
		<>
			<Button
				onClick={() => setConfirmOpen(true)}
				size={size}
				className={className}
				disabled={isPending || tickets === 0 || !published}
				title={tickets === 0 ? t("hyperNoTickets") : undefined}
			>
				<TrainFrontIcon /> {t("projHypertrain")}
			</Button>
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("hyperUseTicketTitle")}</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t("hyperConfirmProject")}
					</p>
					<DialogFooter>
						<Button
							variant="ghost"
							disabled={isPending}
							onClick={() => setConfirmOpen(false)}
						>
							{t("commonCancel")}
						</Button>
						<Button onClick={apply} disabled={isPending}>
							{isPending ? (
								<Loader2Icon className="animate-spin" />
							) : (
								<TrainFrontIcon />
							)}
							{t("hyperActivate")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
