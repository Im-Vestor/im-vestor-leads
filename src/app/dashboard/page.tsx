import type { Prisma } from "@/generated/prisma/client";
import type { InvestmentRange, Sector } from "@/generated/prisma/enums";
import { getDisplayName } from "@/lib/messages/display-name";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";
import { CURRENCY_SYMBOLS } from "../projects/schema";
import { DashboardClient, type LeadProject } from "./dashboard-client";
import {
	type InvestorLead,
	InvestorsDashboardClient,
} from "./investors-dashboard-client";

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

function toLead(
	project: ProjectWithRefs,
	unlocked: boolean,
	t: Awaited<ReturnType<typeof getT>>,
): LeadProject {
	const areaNames = project.areas.map((a) => a.name);
	const base = {
		id: project.id,
		areaNames,
		valueLabel: `${CURRENCY_SYMBOLS[project.currency]}${compact.format(project.investmentGoal)}`,
		country: project.country,
		date: project.createdAt.toISOString().slice(0, 10),
		unlocked,
	};

	if (!unlocked) {
		return {
			...base,
			name: areaNames[0]
				? `${areaNames[0]} ${t("dashOpportunitySuffix")}`
				: t("dashInvestmentOpportunity"),
			desc: (project.quickSolution ?? "").slice(0, 250),
			cover: null,
		};
	}

	const cover = project.media[0] ?? null;
	const about = project.about ?? project.quickSolution ?? "";
	return {
		...base,
		name: project.name,
		desc: about.length > 250 ? `${about.slice(0, 250).trimEnd()}…` : about,
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
	const me = await getOrCreateUser();
	const t = await getT();

	if (me?.role === "ENTREPRENEUR") {
		const sp = await searchParams;
		const sector = typeof sp.sector === "string" ? sp.sector : "";
		const country = typeof sp.country === "string" ? sp.country : "";
		const capacity = typeof sp.capacity === "string" ? sp.capacity : "";

		const investorWhere: Prisma.UserWhereInput = {
			role: "INVESTOR",
			...(sector ? { sectors: { has: sector as Sector } } : {}),
			...(country ? { country } : {}),
			...(capacity ? { investmentCapacity: capacity as InvestmentRange } : {}),
		};

		const investorSelect = {
			id: true,
			name: true,
			email: true,
			country: true,
			sectors: true,
			investmentCapacity: true,
			createdAt: true,
		} satisfies Prisma.UserSelect;

		const now = new Date();
		const [investors, featured] = await Promise.all([
			prisma.user.findMany({
				where: investorWhere,
				orderBy: { createdAt: "desc" },
				take: 60,
				select: investorSelect,
			}),
			prisma.user.findMany({
				where: { role: "INVESTOR", hypertrainUntil: { gt: now } },
				orderBy: { hypertrainUntil: "asc" },
				take: 8,
				select: investorSelect,
			}),
		]);

		const toInvestor = (
			u: Prisma.UserGetPayload<{ select: typeof investorSelect }>,
		): InvestorLead => ({
			id: u.id,
			name: getDisplayName(u),
			country: u.country,
			capacity: u.investmentCapacity,
			sectors: u.sectors,
			date: u.createdAt.toISOString().slice(0, 10),
		});

		return (
			<InvestorsDashboardClient
				featured={featured.map(toInvestor)}
				investors={investors.map(toInvestor)}
				filters={{ sector, country, capacity }}
			/>
		);
	}

	const sp = await searchParams;
	const sector = typeof sp.sector === "string" ? sp.sector : "";
	const country = typeof sp.country === "string" ? sp.country : "";
	const value = typeof sp.value === "string" ? sp.value : "";
	const range = VALUE_FILTERS.find((f) => f.key === value);

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

	const now = new Date();
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
			where: { status: "PUBLISHED", hypertrainUntil: { gt: now } },
			include,
			orderBy: { hypertrainUntil: "asc" },
			take: 8,
		}),
	]);

	const unlockedIds = me
		? new Set(
				(
					await prisma.projectUnlock.findMany({
						where: { userId: me.id },
						select: { projectId: true },
					})
				).map((u) => u.projectId),
			)
		: new Set<string>();

	return (
		<DashboardClient
			areas={areas}
			valueFilters={VALUE_FILTERS.map(({ key, label }) => ({ key, label }))}
			featured={featured.map((p) => toLead(p, unlockedIds.has(p.id), t))}
			projects={projects.map((p) => toLead(p, unlockedIds.has(p.id), t))}
			filters={{ sector, country, value }}
			canUnlock={me?.role === "INVESTOR" || me?.role === "ADMIN"}
			leadCredits={me?.leadCredits ?? 0}
		/>
	);
}
