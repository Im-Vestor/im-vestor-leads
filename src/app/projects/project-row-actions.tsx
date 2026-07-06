"use client";

import { EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProject, setProjectStatus } from "./actions";

export function ProjectRowActions({
	id,
	status,
}: {
	id: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function togglePublish() {
		const next = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
		startTransition(async () => {
			const result = await setProjectStatus(id, next);
			if (result.ok) {
				toast.success(
					next === "PUBLISHED" ? "Project published" : "Project unpublished",
				);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	function remove() {
		if (!confirm("Delete this project? This cannot be undone.")) return;
		startTransition(async () => {
			const result = await deleteProject(id);
			if (result.ok) {
				toast.success("Project deleted");
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="flex flex-wrap gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={togglePublish}
				disabled={isPending}
			>
				{status === "PUBLISHED" ? (
					<>
						<EyeOffIcon /> Unpublish
					</>
				) : (
					<>
						<EyeIcon /> Publish
					</>
				)}
			</Button>
			<Button
				variant="outline"
				size="sm"
				render={<Link href={`/projects/${id}/edit`} />}
			>
				<PencilIcon /> Edit
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={remove}
				disabled={isPending}
				className="text-destructive hover:text-destructive"
			>
				<Trash2Icon /> Delete
			</Button>
		</div>
	);
}
