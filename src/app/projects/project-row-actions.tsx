"use client";

import { EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { deleteProject, setProjectStatus } from "./actions";
import { HypertrainButton } from "./hypertrain-button";

export function ProjectRowActions({
	id,
	status,
	hypertrainUntil,
	tickets,
}: {
	id: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	hypertrainUntil: string | null;
	tickets: number;
}) {
	const t = useTranslation();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function togglePublish() {
		const next = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
		startTransition(async () => {
			const result = await setProjectStatus(id, next);
			if (result.ok) {
				toast.success(
					next === "PUBLISHED"
						? t("projProjectPublished")
						: t("projProjectUnpublished"),
				);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	function remove() {
		if (!confirm(t("projDeleteConfirm"))) return;
		startTransition(async () => {
			const result = await deleteProject(id);
			if (result.ok) {
				toast.success(t("projProjectDeleted"));
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
			<HypertrainButton
				projectId={id}
				activeUntil={hypertrainUntil}
				tickets={tickets}
				published={status === "PUBLISHED"}
				size="sm"
				className="min-h-11 w-full sm:min-h-9 sm:w-auto"
			/>
			<Button
				variant="outline"
				size="sm"
				onClick={togglePublish}
				disabled={isPending}
				className="min-h-11 w-full sm:min-h-9 sm:w-auto"
			>
				{status === "PUBLISHED" ? (
					<>
						<EyeOffIcon /> {t("projUnpublish")}
					</>
				) : (
					<>
						<EyeIcon /> {t("projPublish")}
					</>
				)}
			</Button>
			<Button
				variant="outline"
				size="sm"
				render={<Link href={`/projects/${id}/edit`} />}
				className="min-h-11 w-full sm:min-h-9 sm:w-auto"
			>
				<PencilIcon /> {t("commonEdit")}
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={remove}
				disabled={isPending}
				className="min-h-11 w-full text-destructive hover:text-destructive sm:min-h-9 sm:w-auto"
			>
				<Trash2Icon /> {t("commonDelete")}
			</Button>
		</div>
	);
}
