import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CURRENCY_SYMBOLS } from "../projects/schema";
import { DashboardClient, type LeadProject } from "./dashboard-client";

const VALUE_FILTERS = [
	{ key: "10k-50k", label: "€10K–€50K", min: 10_000, max: 50_000 },
	{ key: "50k-200k", label: "€50K–€200K", min: 50_000, max: 200_000 },
	{ key: "200k-500k", label: "€200K–€500K", min: 200_000, max: 500_000 },
	{ key: "500k-1m", label: "€500K–€1M", min: 500_000, max: 1_000_000 },
	{ key: "1m-5m", label: "€1M–€5M", min: 1_000_000, max: 5_000_000 },
	{ key: "5m+", label: "€5M+", min: 5_000_000, max: null },
] as const;

const compact = new Intl.NumberFormat("en", { notation: "compact" });

type ProjectWithRefs = Prisma.ProjectGetPayload<{
	include: {
		areas: { select: { name: true } };
		media: { select: { url: true; caption: true } };
	};
}>;

function toLead(project: ProjectWithRefs): LeadProject {
	const cover = project.media[0] ?? null;
	return {
		id: project.id,
		name: project.name,
		desc: project.quickSolution ?? project.about ?? "",
		areaNames: project.areas.map((a) => a.name),
		valueLabel: `${CURRENCY_SYMBOLS[project.currency]}${compact.format(project.investmentGoal)}`,
		country: project.country,
		date: project.createdAt.toISOString().slice(0, 10),
		cover: cover
			? { url: cover.url, alt: cover.caption ?? project.name }
			: project.logo
				? { url: project.logo, alt: project.name }
				: null,
	};
}

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const sp = await searchParams;
	const sector = typeof sp.sector === "string" ? sp.sector : "";
	const country = typeof sp.country === "string" ? sp.country : "";
	const value = typeof sp.value === "string" ? sp.value : "";
	const range = VALUE_FILTERS.find((f) => f.key === value);

	// ponytail: filters compare raw amounts across currencies; add FX conversion if non-EUR projects grow
	const where: Prisma.ProjectWhereInput = {
		status: "PUBLISHED",
		...(sector ? { areas: { some: { id: sector } } } : {}),
		...(country ? { country } : {}),
		...(range
			? {
					investmentGoal: {
						gte: range.min,
						...(range.max === null ? {} : { lte: range.max }),
					},
				}
			: {}),
	};

	const include = {
		areas: { select: { name: true }, orderBy: { name: "asc" } },
		media: {
			orderBy: { order: "asc" },
			take: 1,
			select: { url: true, caption: true },
		},
	} satisfies Prisma.ProjectInclude;

	const [areas, projects, featured] = await Promise.all([
		prisma.area.findMany({
			orderBy: { name: "asc" },
			select: { id: true, name: true },
		}),
		prisma.project.findMany({
			where,
			include,
			orderBy: { createdAt: "desc" },
			take: 60,
		}),
		prisma.project.findMany({
			where: { status: "PUBLISHED" },
			include,
			orderBy: { createdAt: "desc" },
			take: 8,
		}),
	]);

	return (
		<DashboardClient
			areas={areas}
			valueFilters={VALUE_FILTERS.map(({ key, label }) => ({ key, label }))}
			featured={featured.map(toLead)}
			projects={projects.map(toLead)}
			filters={{ sector, country, value }}
		/>
	);
}
