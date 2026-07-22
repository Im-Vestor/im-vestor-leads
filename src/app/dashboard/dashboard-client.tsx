"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import {
	ArrowRightIcon,
	LockIcon,
	MessageSquareIcon,
	SearchIcon,
	StarIcon,
	UnlockIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { startConversationForLead } from "@/app/messages/start.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { useTranslation } from "@/hooks/use-translation";
import { COUNTRIES, COUNTRY_LABEL_KEYS } from "@/lib/constants";
import { unlockProject } from "./actions";

export type LeadProject = {
	id: string;
	name: string;
	desc: string;
	areaNames: string[];
	valueLabel: string;
	country: string | null;
	date: string;
	unlocked: boolean;
	cover: { url: string; alt: string } | null;
};

function ProjectMeta({ project }: { project: LeadProject }) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{project.areaNames.map((name) => (
				<Badge key={name} variant="secondary">
					{name}
				</Badge>
			))}
			<Badge variant="secondary">{project.valueLabel}</Badge>
			{project.country && <Badge variant="outline">{project.country}</Badge>}
		</div>
	);
}

function FeaturedCard({ project }: { project: LeadProject }) {
	const t = useTranslation();
	return (
		<Card className="flex-1 overflow-hidden pt-0">
			{project.cover ? (
				// biome-ignore lint/performance/noImgElement: supabase storage preview
				<img
					src={project.cover.url}
					alt={project.cover.alt}
					width={640}
					height={160}
					className="h-40 w-full object-cover"
				/>
			) : (
				<div className="flex h-40 w-full items-center justify-center bg-muted">
					<StarIcon className="size-8 text-muted-foreground" />
				</div>
			)}
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{project.name}
					<Badge>
						<StarIcon /> {t("dashFeatured")}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<ProjectMeta project={project} />
				<CardDescription className="line-clamp-3">
					{project.desc}
				</CardDescription>
			</CardContent>
		</Card>
	);
}

function ProjectCard({
	project,
	canUnlock,
	leadCredits,
}: {
	project: LeadProject;
	canUnlock: boolean;
	leadCredits: number;
}) {
	const t = useTranslation();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function unlock() {
		startTransition(async () => {
			const result = await unlockProject(project.id);
			if (result.ok) {
				toast.success(t("dashLeadUnlocked"));
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	function message() {
		startTransition(async () => {
			const result = await startConversationForLead({ projectId: project.id });
			if (result.ok) {
				router.push(`/messages?c=${result.data.conversationId}`);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<Card
			className={
				project.unlocked
					? "ring-2 ring-gold/60 shadow-[0_0_28px_rgba(237,214,137,0.2)] bg-gradient-to-b from-gold/[0.07] to-transparent"
					: undefined
			}
		>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{project.unlocked && project.cover ? (
						// biome-ignore lint/performance/noImgElement: supabase storage preview
						<img
							src={project.cover.url}
							alt={project.cover.alt}
							width={36}
							height={36}
							className="size-9 shrink-0 rounded-md border object-cover"
						/>
					) : project.unlocked ? (
						<UnlockIcon className="size-4 text-muted-foreground" />
					) : (
						<LockIcon className="size-4 text-muted-foreground" />
					)}
					{project.name}
				</CardTitle>
				<div className="pt-1">
					<ProjectMeta project={project} />
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<CardDescription className={project.unlocked ? "" : "line-clamp-3"}>
					{project.desc}
				</CardDescription>
				{!project.unlocked && (
					<div className="flex items-center gap-2 rounded-md border border-dashed p-2.5 text-muted-foreground text-xs">
						<LockIcon className="size-3.5 shrink-0" />
						{t("dashLockedNotice")}
					</div>
				)}
			</CardContent>
			<CardFooter className="mt-auto flex-wrap justify-between gap-x-4 gap-y-3">
				<span className="text-muted-foreground text-xs">{project.date}</span>
				<div className="flex gap-2">
					{project.unlocked ? (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={message}
								disabled={isPending}
							>
								<MessageSquareIcon /> {t("dashMessage")}
							</Button>
							<Button
								size="sm"
								render={<Link href={`/projects/${project.id}`} />}
							>
								{t("dashViewDetails")} <ArrowRightIcon />
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" size="sm">
								<ZapIcon /> {t("dashPoke")}
							</Button>
							{canUnlock && (
								<Button
									size="sm"
									onClick={unlock}
									disabled={isPending || leadCredits < 1}
									title={leadCredits < 1 ? t("dashNoCredits") : ""}
								>
									<UnlockIcon /> {t("dashUnlockCredit")}
								</Button>
							)}
						</>
					)}
				</div>
			</CardFooter>
		</Card>
	);
}

export function DashboardClient({
	areas,
	valueFilters,
	featured,
	projects,
	filters,
	canUnlock,
	leadCredits,
}: {
	areas: { id: string; name: string }[];
	valueFilters: { key: string; label: string }[];
	featured: LeadProject[];
	projects: LeadProject[];
	filters: { sector: string; country: string; value: string };
	canUnlock: boolean;
	leadCredits: number;
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

	function setFilter(key: "sector" | "country" | "value", value: string) {
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
						<h2 className="font-semibold text-lg">Hyper Train</h2>
						<Badge variant="secondary">{t("dashNew")}</Badge>
					</div>
					<Carousel
						setApi={setApi}
						opts={{ align: "start", loop: true }}
						plugins={[autoScroll.current]}
					>
						<CarouselContent className="items-stretch">
							{featured.map((p) => (
								<CarouselItem
									key={p.id}
									className="flex flex-col md:basis-1/2 lg:basis-1/3"
								>
									<FeaturedCard project={p} />
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>
				</section>
			)}

			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("dashDiscoverLeads")}
					</h1>
					<p className="text-muted-foreground text-sm">{t("dashSubtitle")}</p>
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
						{areas.map((area) => (
							<NativeSelectOption key={area.id} value={area.id}>
								{area.name}
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
						value={filters.value}
						onChange={(e) => setFilter("value", e.target.value)}
						aria-label={t("dashValue")}
					>
						<NativeSelectOption value="">
							{t("dashAllValues")}
						</NativeSelectOption>
						{valueFilters.map((v) => (
							<NativeSelectOption key={v.key} value={v.key}>
								{v.label}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</div>
			</div>

			{projects.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{projects.map((p) => (
						<ProjectCard
							key={p.id}
							project={p}
							canUnlock={canUnlock}
							leadCredits={leadCredits}
						/>
					))}
				</div>
			) : (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<SearchIcon />
						</EmptyMedia>
						<EmptyTitle>{t("dashNoLeads")}</EmptyTitle>
						<EmptyDescription>{t("dashTryAdjusting")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</section>
	);
}
