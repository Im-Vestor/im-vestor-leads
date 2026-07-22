"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import { SearchIcon, StarIcon, UsersIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StartMessageButton } from "@/components/messages/start-message-button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import type { InvestmentRange, Sector } from "@/generated/prisma/enums";
import { useTranslation } from "@/hooks/use-translation";
import {
	COUNTRIES,
	COUNTRY_LABEL_KEYS,
	INVESTMENT_RANGE_LABELS,
	INVESTMENT_RANGES,
	SECTOR_LABEL_KEYS,
	SECTORS,
} from "@/lib/constants";
import { getInitials } from "@/lib/messages/display-name";
import { cn } from "@/lib/utils";

export type InvestorLead = {
	id: string;
	name: string;
	country: string | null;
	capacity: InvestmentRange | null;
	sectors: Sector[];
	date: string;
};

function InvestorAvatar({
	name,
	className,
}: {
	name: string;
	className?: string;
}) {
	const initials = getInitials(name);
	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep font-semibold text-black",
				className,
			)}
		>
			{initials || <UsersIcon className="size-1/2" />}
		</span>
	);
}

function InvestorMeta({ investor }: { investor: InvestorLead }) {
	const t = useTranslation();
	return (
		<div className="flex flex-wrap gap-1.5">
			{investor.capacity && (
				<Badge>{INVESTMENT_RANGE_LABELS[investor.capacity]}</Badge>
			)}
			{investor.sectors.map((s) => (
				<Badge key={s} variant="secondary">
					{t(SECTOR_LABEL_KEYS[s])}
				</Badge>
			))}
			{investor.country && <Badge variant="outline">{investor.country}</Badge>}
		</div>
	);
}

function FeaturedInvestorCard({ investor }: { investor: InvestorLead }) {
	const t = useTranslation();
	return (
		<Card className="h-full overflow-hidden pt-0">
			<div className="flex h-40 w-full items-center justify-center bg-muted">
				<InvestorAvatar name={investor.name} className="size-16 text-xl" />
			</div>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{investor.name}
					<Badge>
						<StarIcon /> {t("dashFeatured")}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<InvestorMeta investor={investor} />
			</CardContent>
		</Card>
	);
}

function InvestorCard({ investor }: { investor: InvestorLead }) {
	const t = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<InvestorAvatar name={investor.name} className="size-9 text-xs" />
					{investor.name}
				</CardTitle>
				<div className="pt-1">
					<InvestorMeta investor={investor} />
				</div>
			</CardHeader>
			<CardFooter className="mt-auto flex-wrap justify-between gap-x-4 gap-y-3">
				<span className="text-muted-foreground text-xs">{investor.date}</span>
				<StartMessageButton
					targetUserId={investor.id}
					variant="outline"
					label={t("dashMessage")}
				/>
			</CardFooter>
		</Card>
	);
}

export function InvestorsDashboardClient({
	featured,
	investors,
	filters,
}: {
	featured: InvestorLead[];
	investors: InvestorLead[];
	filters: { sector: string; country: string; capacity: string };
}) {
	const t = useTranslation();
	const router = useRouter();
	const searchParams = useSearchParams();

	const autoScroll = useRef(
		AutoScroll({
			speed: 1,
			stopOnInteraction: false,
			stopOnMouseEnter: true,
		}),
	);
	const [api, setApi] = useState<CarouselApi>();

	useEffect(() => {
		if (!api) return;

		const resume = () => {
			api.reInit();
			const autoScrollPlugin = api.plugins().autoScroll;
			if (autoScrollPlugin && !autoScrollPlugin.isPlaying()) {
				autoScrollPlugin.play();
			}
		};

		if (document.readyState === "complete") {
			resume();
		} else {
			window.addEventListener("load", resume);
			return () => window.removeEventListener("load", resume);
		}
	}, [api]);

	function setFilter(key: "sector" | "country" | "capacity", value: string) {
		const params = new URLSearchParams(searchParams);
		if (value) params.set(key, value);
		else params.delete(key);
		const query = params.toString();
		router.replace(query ? `/dashboard?${query}` : "/dashboard", {
			scroll: false,
		});
	}

	return (
		<section className="mx-auto max-w-content px-4 pb-16 md:px-6">
			{featured.length > 0 && (
				<section className="mb-10">
					<div className="mb-4 flex items-center gap-2">
						<StarIcon className="size-4" />
						<h2 className="font-semibold text-lg">
							{t("dashFeaturedInvestors")}
						</h2>
						<Badge variant="secondary">{t("dashNew")}</Badge>
					</div>
					<Carousel
						setApi={setApi}
						opts={{ align: "start", loop: true }}
						plugins={[autoScroll.current]}
					>
						<CarouselContent>
							{featured.map((inv) => (
								<CarouselItem
									key={inv.id}
									className="h-full md:basis-1/2 lg:basis-1/3"
								>
									<FeaturedInvestorCard investor={inv} />
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>
				</section>
			)}

			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("dashDiscoverInvestors")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("dashInvestorsSubtitle")}
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
					<NativeSelect
						className="w-full sm:w-auto"
						value={filters.sector}
						onChange={(e) => setFilter("sector", e.target.value)}
						aria-label={t("dashSector")}
					>
						<NativeSelectOption value="">
							{t("dashAllSectors")}
						</NativeSelectOption>
						{SECTORS.map((s) => (
							<NativeSelectOption key={s} value={s}>
								{t(SECTOR_LABEL_KEYS[s])}
							</NativeSelectOption>
						))}
					</NativeSelect>
					<NativeSelect
						className="w-full sm:w-auto"
						value={filters.country}
						onChange={(e) => setFilter("country", e.target.value)}
						aria-label={t("dashCountry")}
					>
						<NativeSelectOption value="">
							{t("dashAllCountries")}
						</NativeSelectOption>
						{COUNTRIES.map((c) => (
							<NativeSelectOption key={c} value={c}>
								{t(COUNTRY_LABEL_KEYS[c])}
							</NativeSelectOption>
						))}
					</NativeSelect>
					<NativeSelect
						className="w-full sm:w-auto"
						value={filters.capacity}
						onChange={(e) => setFilter("capacity", e.target.value)}
						aria-label={t("dashCapacity")}
					>
						<NativeSelectOption value="">
							{t("dashAllCapacities")}
						</NativeSelectOption>
						{INVESTMENT_RANGES.map((r) => (
							<NativeSelectOption key={r} value={r}>
								{INVESTMENT_RANGE_LABELS[r]}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</div>
			</div>

			{investors.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{investors.map((inv) => (
						<InvestorCard key={inv.id} investor={inv} />
					))}
				</div>
			) : (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<SearchIcon />
						</EmptyMedia>
						<EmptyTitle>{t("dashNoInvestors")}</EmptyTitle>
						<EmptyDescription>{t("dashTryAdjusting")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</section>
	);
}
