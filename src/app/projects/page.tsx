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
import { requireEntrepreneur } from "./_entrepreneur-guard";
import { ProjectRowActions } from "./project-row-actions";
import { CURRENCY_SYMBOLS, STATUS_LABELS } from "./schema";

export default async function ProjectsPage() {
	const user = await requireEntrepreneur();
	if (!user) redirect("/dashboard");

	const projects = await prisma.project.findMany({
		where: { entrepreneurId: user.id },
		include: { areas: { select: { name: true }, orderBy: { name: "asc" } } },
		orderBy: { createdAt: "desc" },
	});

	return (
		<section className="mx-auto w-full max-w-content px-6 pb-16">
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">My Projects</h1>
					<p className="text-muted-foreground text-sm">
						Create and manage the projects investors will discover.
					</p>
				</div>
				<Button render={<Link href="/projects/new" />}>
					<PlusIcon /> New project
				</Button>
			</div>

			{projects.length === 0 ? (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<RocketIcon />
						</EmptyMedia>
						<EmptyTitle>No projects yet</EmptyTitle>
						<EmptyDescription>
							Create your first project to start attracting investors.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{projects.map((project) => (
						<Card key={project.id}>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Link
										href={`/projects/${project.id}`}
										className="hover:underline"
									>
										{project.name}
									</Link>
									<Badge
										variant={
											project.status === "PUBLISHED" ? "default" : "secondary"
										}
									>
										{STATUS_LABELS[project.status]}
									</Badge>
								</CardTitle>
								<div className="flex flex-wrap gap-1.5 pt-1">
									{project.areas.map((area) => (
										<Badge key={area.name} variant="secondary">
											{area.name}
										</Badge>
									))}
									{project.country && (
										<Badge variant="outline">{project.country}</Badge>
									)}
									<Badge variant="outline">
										Goal {CURRENCY_SYMBOLS[project.currency]}
										{project.investmentGoal.toLocaleString("en-US")}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{project.quickSolution && (
									<CardDescription className="line-clamp-2">
										{project.quickSolution}
									</CardDescription>
								)}
								<ProjectRowActions id={project.id} status={project.status} />
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</section>
	);
}
