"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import {
	LockIcon,
	SearchIcon,
	StarIcon,
	UnlockIcon,
	ZapIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
	type CarouselApi,
	Carousel,
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
import {
	COUNTRIES,
	PROJECTS,
	type Project,
	SECTORS,
	VALUE_RANGES,
} from "@/lib/leads-data";

function ProjectMeta({ project }: { project: Project }) {
	return (
		<div className="flex flex-wrap gap-1.5">
			<Badge variant="secondary">{project.sector}</Badge>
			<Badge variant="secondary">{project.value}</Badge>
			<Badge variant="outline">{project.country}</Badge>
		</div>
	);
}

function FeaturedCard({ project }: { project: Project }) {
	const cover = project.media[0];
	return (
		<Card className="overflow-hidden pt-0">
			{cover ? (
				// biome-ignore lint/performance/noImgElement: external unsplash preview
				<img
					src={cover.url}
					alt={cover.name}
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
					{project.title}
					<Badge>
						<StarIcon /> Featured
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

function ProjectCard({ project }: { project: Project }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<LockIcon className="size-4 text-muted-foreground" />
					{project.title}
				</CardTitle>
				<div className="pt-1">
					<ProjectMeta project={project} />
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<CardDescription className="line-clamp-3">
					{project.desc}
				</CardDescription>
				<div className="flex items-center gap-2 rounded-md border border-dashed p-2.5 text-muted-foreground text-xs">
					<LockIcon className="size-3.5 shrink-0" />
					Media and full profile locked. Send a poke or unlock the lead.
				</div>
			</CardContent>
			<CardFooter className="justify-between">
				<span className="text-muted-foreground text-xs">{project.date}</span>
				<div className="flex gap-2">
					<Button variant="outline" size="sm">
						<ZapIcon /> Poke
					</Button>
					<Button size="sm">
						<UnlockIcon /> Unlock €24.99
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}

export default function DashboardPage() {
	const [sector, setSector] = useState("");
	const [country, setCountry] = useState("");
	const [value, setValue] = useState("");

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

	const featured = useMemo(() => PROJECTS.filter((p) => p.hyperTrain), []);
	const filtered = useMemo(
		() =>
			PROJECTS.filter(
				(p) =>
					(!sector || p.sector === sector) &&
					(!country || p.country === country) &&
					(!value || p.value === value),
			),
		[sector, country, value],
	);

	return (
		<section className="mx-auto max-w-content px-6 pb-16">
			{featured.length > 0 && (
				<section className="mb-10">
					<div className="mb-4 flex items-center gap-2">
						<StarIcon className="size-4" />
						<h2 className="font-semibold text-lg">Featured Opportunities</h2>
						<Badge variant="secondary">Hyper Train</Badge>
					</div>
					<Carousel
						setApi={setApi}
						opts={{ align: "start", loop: true }}
						plugins={[autoScroll.current]}
					>
						<CarouselContent>
							{featured.map((p) => (
								<CarouselItem key={p.id} className="md:basis-1/2 lg:basis-1/3">
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
						Discover Leads
					</h1>
					<p className="text-muted-foreground text-sm">
						Browse opportunities by your criteria
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<NativeSelect
						value={sector}
						onChange={(e) => setSector(e.target.value)}
						aria-label="Sector"
					>
						<NativeSelectOption value="">All sectors</NativeSelectOption>
						{SECTORS.map((s) => (
							<NativeSelectOption key={s} value={s}>
								{s}
							</NativeSelectOption>
						))}
					</NativeSelect>
					<NativeSelect
						value={country}
						onChange={(e) => setCountry(e.target.value)}
						aria-label="Country"
					>
						<NativeSelectOption value="">All countries</NativeSelectOption>
						{COUNTRIES.map((c) => (
							<NativeSelectOption key={c} value={c}>
								{c}
							</NativeSelectOption>
						))}
					</NativeSelect>
					<NativeSelect
						value={value}
						onChange={(e) => setValue(e.target.value)}
						aria-label="Value"
					>
						<NativeSelectOption value="">All values</NativeSelectOption>
						{VALUE_RANGES.map((v) => (
							<NativeSelectOption key={v} value={v}>
								{v}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</div>
			</div>

			{filtered.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{filtered.map((p) => (
						<ProjectCard key={p.id} project={p} />
					))}
				</div>
			) : (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<SearchIcon />
						</EmptyMedia>
						<EmptyTitle>No leads found</EmptyTitle>
						<EmptyDescription>Try adjusting your filters.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</section>
	);
}
