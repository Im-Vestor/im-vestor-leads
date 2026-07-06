import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireEntrepreneur } from "../../_entrepreneur-guard";
import { ProjectForm } from "../../project-form";

export default async function EditProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireEntrepreneur();
	if (!user) redirect("/dashboard");

	const { id } = await params;
	const project = await prisma.project.findUnique({
		where: { id },
		include: {
			media: { orderBy: { order: "asc" } },
			areas: { select: { id: true } },
		},
	});
	if (
		!project ||
		(project.entrepreneurId !== user.id && user.role !== "ADMIN")
	) {
		notFound();
	}

	const areas = await prisma.area.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});

	return (
		<section className="mx-auto w-full max-w-6xl px-6 pb-16">
			<div className="mb-6">
				<h1 className="font-semibold text-2xl tracking-tight">Edit project</h1>
				<p className="text-muted-foreground text-sm">{project.name}</p>
			</div>
			<ProjectForm
				areas={areas}
				projectId={project.id}
				initial={{
					name: project.name,
					quickSolution: project.quickSolution ?? "",
					about: project.about ?? "",
					website: project.website ?? "",
					country: project.country ?? "",
					areaIds: project.areas.map((a) => a.id),
					currency: project.currency,
					investmentGoal: String(project.investmentGoal),
					startInvestment:
						project.startInvestment === null
							? ""
							: String(project.startInvestment),
					equity: project.equity === null ? "" : String(project.equity),
					annualRevenue:
						project.annualRevenue === null ? "" : String(project.annualRevenue),
					monthsToReturn:
						project.monthsToReturn === null
							? ""
							: String(project.monthsToReturn),
					investorSlots:
						project.investorSlots === null ? "" : String(project.investorSlots),
					logo: project.logo ?? "",
					videoPitchUrl: project.videoPitchUrl ?? "",
					photos: project.media
						.filter((m) => m.type === "PHOTO")
						.map((m) => ({ url: m.url, caption: m.caption ?? "" })),
				}}
			/>
		</section>
	);
}
