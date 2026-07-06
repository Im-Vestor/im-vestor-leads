import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireEntrepreneur } from "../_entrepreneur-guard";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
	const user = await requireEntrepreneur();
	if (!user) redirect("/dashboard");

	const areas = await prisma.area.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});

	return (
		<section className="mx-auto w-full max-w-6xl px-6 pb-16">
			<div className="mb-6">
				<h1 className="font-semibold text-2xl tracking-tight">New project</h1>
				<p className="text-muted-foreground text-sm">
					Fill in the basics — you can publish it when it's ready.
				</p>
			</div>
			<ProjectForm areas={areas} />
		</section>
	);
}
