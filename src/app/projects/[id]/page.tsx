import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";
import { HypertrainButton } from "../hypertrain-button";
import { CURRENCY_SYMBOLS } from "../schema";

export default async function ProjectDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const t = await getT();
	const user = await getOrCreateUser();
	if (!user) redirect("/sign-in");

	const statusLabels = {
		DRAFT: t("projStatusDraft"),
		PUBLISHED: t("projStatusPublished"),
		ARCHIVED: t("projStatusArchived"),
	};

	const { id } = await params;
	const project = await prisma.project.findUnique({
		where: { id },
		include: {
			areas: { select: { name: true }, orderBy: { name: "asc" } },
			media: { orderBy: { order: "asc" } },
		},
	});
	if (!project) notFound();

	const canEdit = project.entrepreneurId === user.id || user.role === "ADMIN";
	if (!canEdit) {
		// Non-owners may view only a project they have permanently unlocked.
		const unlock = await prisma.projectUnlock.findUnique({
			where: { userId_projectId: { userId: user.id, projectId: id } },
			select: { id: true },
		});
		if (!unlock) notFound();
	}

	const symbol = CURRENCY_SYMBOLS[project.currency];
	const money = (value: number | null) =>
		value === null ? "—" : `${symbol}${value.toLocaleString("en-US")}`;
	const photos = project.media.filter((m) => m.type === "PHOTO");

	const facts: [string, string][] = [
		[t("projInvestmentGoal"), money(project.investmentGoal)],
		[t("projMinimumTicket"), money(project.startInvestment)],
		[
			t("projEquityOffered"),
			project.equity === null ? "—" : `${project.equity}%`,
		],
		[t("projAnnualRevenue"), money(project.annualRevenue)],
		[
			t("projMonthsToReturn"),
			project.monthsToReturn === null ? "—" : String(project.monthsToReturn),
		],
		[
			t("projInvestorSlots"),
			project.investorSlots === null ? "—" : String(project.investorSlots),
		],
	];

	return (
		<section className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 md:px-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex min-w-0 items-center gap-4">
					{project.logo && (
						// biome-ignore lint/performance/noImgElement: supabase storage image
						<img
							src={project.logo}
							alt={`${project.name} ${t("projLogoWord")}`}
							className="size-16 rounded-md border object-cover"
						/>
					)}
					<div className="min-w-0">
						<h1 className="flex flex-wrap items-center gap-2 font-semibold text-2xl tracking-tight">
							{project.name}
							<Badge
								variant={
									project.status === "PUBLISHED" ? "default" : "secondary"
								}
							>
								{statusLabels[project.status]}
							</Badge>
						</h1>
						<div className="mt-1 flex flex-wrap gap-1.5">
							{project.areas.map((area) => (
								<Badge key={area.name} variant="secondary">
									{area.name}
								</Badge>
							))}
							{project.country && (
								<Badge variant="outline">{project.country}</Badge>
							)}
						</div>
					</div>
				</div>
				{canEdit && (
					<div className="flex flex-wrap gap-2">
						<HypertrainButton
							projectId={project.id}
							activeUntil={project.hypertrainUntil?.toISOString() ?? null}
							tickets={user.hypertrainTickets}
							published={project.status === "PUBLISHED"}
						/>
						<Button
							variant="outline"
							render={<Link href={`/projects/${project.id}/edit`} />}
						>
							<PencilIcon /> {t("commonEdit")}
						</Button>
					</div>
				)}
			</div>

			{project.quickSolution && (
				<p className="text-lg text-muted-foreground">{project.quickSolution}</p>
			)}

			<Card>
				<CardHeader>
					<CardTitle>{t("projInvestment")}</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						{facts.map(([label, value]) => (
							<div key={label}>
								<dt className="text-muted-foreground text-sm">{label}</dt>
								<dd className="font-medium">{value}</dd>
							</div>
						))}
					</dl>
				</CardContent>
			</Card>

			{project.about && (
				<Card>
					<CardHeader>
						<CardTitle>{t("projAbout")}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap text-sm leading-relaxed">
							{project.about}
						</p>
					</CardContent>
				</Card>
			)}

			{project.videoPitchUrl && (
				<Card>
					<CardHeader>
						<CardTitle>{t("projPitchVideo")}</CardTitle>
					</CardHeader>
					<CardContent>
						{/* biome-ignore lint/a11y/useMediaCaption: user-uploaded pitch video */}
						<video
							src={project.videoPitchUrl}
							controls
							className="mx-auto aspect-video w-full max-w-2xl rounded-md border bg-black object-cover"
						/>
					</CardContent>
				</Card>
			)}

			{photos.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t("projPhotos")}</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{photos.map((photo) => (
							<figure
								key={photo.id}
								className="relative overflow-hidden rounded-md border"
							>
								{/* biome-ignore lint/performance/noImgElement: supabase storage image */}
								<img
									src={photo.url}
									alt={photo.caption ?? t("projProjectPhoto")}
									className="aspect-video w-full object-cover"
								/>
								{photo.caption && (
									<figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2 text-white text-xs">
										{photo.caption}
									</figcaption>
								)}
							</figure>
						))}
					</CardContent>
				</Card>
			)}

			{project.website && (
				<p className="text-sm break-words">
					{t("projWebsite")}:{" "}
					<a
						href={project.website}
						target="_blank"
						rel="noreferrer"
						className="break-all underline"
					>
						{project.website}
					</a>
				</p>
			)}
		</section>
	);
}
