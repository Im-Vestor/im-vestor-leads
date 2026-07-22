"use client";

import { Loader2Icon, TrainFrontIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import {
	applyHypertrainToProfile,
	applyHypertrainToProject,
} from "./hypertrain.actions";

type BoostableProject = { id: string; name: string; active: boolean };

export function UseHypertrainTicket({
	role,
	tickets,
	profileActive,
	projects,
}: {
	role: string;
	tickets: number;
	profileActive: boolean;
	projects: BoostableProject[];
}) {
	const t = useTranslation();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	if (tickets <= 0) return null;

	function done(result: { ok: boolean; error?: string }) {
		if (result.ok) {
			toast.success(t("hyperApplied"));
			setOpen(false);
			router.refresh();
		} else {
			toast.error(result.error ?? t("errHyperFailed"));
		}
	}

	function applyProfile() {
		startTransition(async () => done(await applyHypertrainToProfile()));
	}

	function applyProject(projectId: string) {
		startTransition(async () =>
			done(await applyHypertrainToProject(projectId)),
		);
	}

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				<TrainFrontIcon /> {t("hyperUseTicket")} ({tickets})
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("hyperUseTicketTitle")}</DialogTitle>
					</DialogHeader>
					{role === "INVESTOR" ? (
						<>
							<p className="text-muted-foreground text-sm">
								{t("hyperConfirmInvestor")}
							</p>
							<DialogFooter>
								<Button
									onClick={applyProfile}
									disabled={isPending || profileActive}
									className={
										profileActive
											? "animate-pulse bg-purple-600 text-white disabled:opacity-100"
											: undefined
									}
								>
									{isPending ? (
										<Loader2Icon className="animate-spin" />
									) : (
										<TrainFrontIcon />
									)}
									{profileActive ? t("hyperActive") : t("hyperActivate")}
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<p className="text-muted-foreground text-sm">
								{t("hyperConfirmEntrepreneur")}
							</p>
							{projects.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									{t("hyperNoProjects")}
								</p>
							) : (
								<div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
									{projects.map((p) => (
										<button
											key={p.id}
											type="button"
											disabled={isPending || p.active}
											onClick={() => applyProject(p.id)}
											className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left font-medium text-sm transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-70"
										>
											<span className="min-w-0 truncate">{p.name}</span>
											{p.active ? (
												<span className="flex shrink-0 animate-pulse items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-white text-xs">
													<TrainFrontIcon className="size-3" />
													{t("hyperActive")}
												</span>
											) : (
												<TrainFrontIcon className="size-4 shrink-0 text-primary" />
											)}
										</button>
									))}
								</div>
							)}
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
