import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireEntrepreneur } from "../_entrepreneur-guard";
import { CURRENCY_SYMBOLS, STATUS_LABELS } from "../schema";

export default async function ProjectDetailPage({
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
			areas: { select: { name: true }, orderBy: { name: "asc" } },
			media: { orderBy: { order: "asc" } },
		},
	});
	if (
		!project ||
		(project.entrepreneurId !== user.id && user.role !== "ADMIN")
	) {
		notFound();
	}

	const symbol = CURRENCY_SYMBOLS[project.currency];
	const money = (value: number | null) =>
		value === null ? "—" : `${symbol}${value.toLocaleString("en-US")}`;
	const photos = project.media.filter((m) => m.type === "PHOTO");

	const facts: [string, string][] = [
		["Investment goal", money(project.investmentGoal)],
		["Minimum ticket", money(project.startInvestment)],
		["Equity offered", project.equity === null ? "—" : `${project.equity}%`],
		["Annual revenue", money(project.annualRevenue)],
		[
			"Months to return",
			project.monthsToReturn === null ? "—" : String(project.monthsToReturn),
		],
		[
			"Investor slots",
			project.investorSlots === null ? "—" : String(project.investorSlots),
		],
	];

	return (
		<section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-16">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex items-center gap-4">
					{project.logo && (
						// biome-ignore lint/performance/noImgElement: supabase storage image
						<img
							src={project.logo}
							alt={`${project.name} logo`}
							className="size-16 rounded-md border object-cover"
						/>
					)}
					<div>
						<h1 className="flex items-center gap-2 font-semibold text-2xl tracking-tight">
							{project.name}
							<Badge
								variant={
									project.status === "PUBLISHED" ? "default" : "secondary"
								}
							>
								{STATUS_LABELS[project.status]}
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
				<Button
					variant="outline"
					render={<Link href={`/projects/${project.id}/edit`} />}
				>
					<PencilIcon /> Edit
				</Button>
			</div>

			{project.quickSolution && (
				<p className="text-lg text-muted-foreground">{project.quickSolution}</p>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Investment</CardTitle>
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
						<CardTitle>About</CardTitle>
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
						<CardTitle>Pitch video</CardTitle>
					</CardHeader>
					<CardContent>
						{/* biome-ignore lint/a11y/useMediaCaption: user-uploaded pitch video */}
						<video
							src={project.videoPitchUrl}
							controls
							className="max-h-96 w-full rounded-md border bg-black"
						/>
					</CardContent>
				</Card>
			)}

			{photos.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Photos</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{photos.map((photo) => (
							<figure key={photo.id} className="flex flex-col gap-1">
								{/* biome-ignore lint/performance/noImgElement: supabase storage image */}
								<img
									src={photo.url}
									alt={photo.caption ?? "Project photo"}
									className="h-48 w-full rounded-md border object-cover"
								/>
								{photo.caption && (
									<figcaption className="text-muted-foreground text-xs">
										{photo.caption}
									</figcaption>
								)}
							</figure>
						))}
					</CardContent>
				</Card>
			)}

			{project.website && (
				<p className="text-sm">
					Website:{" "}
					<a
						href={project.website}
						target="_blank"
						rel="noreferrer"
						className="underline"
					>
						{project.website}
					</a>
				</p>
			)}
		</section>
	);
}
