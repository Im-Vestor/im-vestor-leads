import { PlusIcon, RocketIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";
import { requireEntrepreneur } from "./_entrepreneur-guard";
import { ProjectRowActions } from "./project-row-actions";
import { CURRENCY_SYMBOLS } from "./schema";

export default async function ProjectsPage() {
	const t = await getT();
	const user = await requireEntrepreneur();
	if (!user) redirect("/dashboard");

	const statusLabels = {
		DRAFT: t("projStatusDraft"),
		PUBLISHED: t("projStatusPublished"),
		ARCHIVED: t("projStatusArchived"),
	};

	const projects = await prisma.project.findMany({
		where: { entrepreneurId: user.id },
		include: { areas: { select: { name: true }, orderBy: { name: "asc" } } },
		orderBy: { createdAt: "desc" },
	});

	return (
		<section className="mx-auto w-full max-w-content px-4 pb-16 md:px-6">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
				<div className="min-w-0">
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("projMyProjects")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("projMyProjectsDesc")}
					</p>
				</div>
				<Button
					className="w-full sm:w-auto"
					render={<Link href="/projects/new" />}
				>
					<PlusIcon /> {t("projNewProject")}
				</Button>
			</div>

			{projects.length === 0 ? (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<RocketIcon />
						</EmptyMedia>
						<EmptyTitle>{t("projNoProjectsYet")}</EmptyTitle>
						<EmptyDescription>{t("projNoProjectsDesc")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{projects.map((project) => {
						const symbol = CURRENCY_SYMBOLS[project.currency];
						const money = (value: number | null) =>
							value === null
								? "—"
								: `${symbol}${value.toLocaleString("en-US")}`;
						const stats: [string, string][] = [
							[t("projInvestmentGoal"), money(project.investmentGoal)],
							[t("projMinimumTicket"), money(project.startInvestment)],
							[
								t("projEquityOffered"),
								project.equity === null ? "—" : `${project.equity}%`,
							],
						];
						return (
							<Card key={project.id} className="flex flex-col">
								<CardHeader>
									<div className="flex items-start gap-3">
										{project.logo ? (
											// biome-ignore lint/performance/noImgElement: supabase storage image
											<img
												src={project.logo}
												alt={`${project.name} ${t("projLogoWord")}`}
												className="size-12 shrink-0 rounded-lg border object-cover"
											/>
										) : (
											<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-lg text-primary">
												{project.name.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="min-w-0 flex-1">
											<CardTitle className="flex flex-wrap items-center gap-2">
												<Link
													href={`/projects/${project.id}`}
													className="min-w-0 break-words hover:underline"
												>
													{project.name}
												</Link>
												<Badge
													variant={
														project.status === "PUBLISHED"
															? "default"
															: "secondary"
													}
												>
													{statusLabels[project.status]}
												</Badge>
											</CardTitle>
											{project.quickSolution && (
												<CardDescription className="mt-1 line-clamp-2">
													{project.quickSolution}
												</CardDescription>
											)}
										</div>
									</div>
									<div className="flex flex-wrap gap-1.5 pt-1">
										{project.areas.map((area) => (
											<Badge key={area.name} variant="secondary">
												{area.name}
											</Badge>
										))}
										{project.country && (
											<Badge variant="outline">{project.country}</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col justify-end gap-4">
									<dl className="grid grid-cols-3 gap-3">
										{stats.map(([label, value]) => (
											<div key={label} className="min-w-0">
												<dt className="truncate text-muted-foreground text-xs">
													{label}
												</dt>
												<dd className="truncate font-medium text-sm">
													{value}
												</dd>
											</div>
										))}
									</dl>
									<div className="border-t pt-3">
										<ProjectRowActions
											id={project.id}
											status={project.status}
											hypertrainUntil={
												project.hypertrainUntil?.toISOString() ?? null
											}
											tickets={user.hypertrainTickets}
										/>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</section>
	);
}
