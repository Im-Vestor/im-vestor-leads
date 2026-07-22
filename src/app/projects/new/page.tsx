import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";
import { requireEntrepreneur } from "../_entrepreneur-guard";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
	const t = await getT();
	const user = await requireEntrepreneur();
	if (!user) redirect("/dashboard");

	const areas = await prisma.area.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});

	return (
		<section className="mx-auto w-full max-w-content px-4 pb-16 md:px-6">
			<ProjectForm
				title={t("projNewProject")}
				subtitle={t("projNewProjectDesc")}
				areas={areas}
			/>
		</section>
	);
}
