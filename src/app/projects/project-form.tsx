"use client";

import {
	ImageIcon,
	InfoIcon,
	Loader2Icon,
	TrendingUpIcon,
	VideoIcon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { COUNTRIES, COUNTRY_LABEL_KEYS } from "@/lib/constants";
import {
	type UploadKind,
	uploadToSignedUrl,
	validateMediaFile,
} from "@/lib/supabase/storage";
import { createProject, createUploadUrl, updateProject } from "./actions";
import { RecordVideoDialog } from "./record-video-dialog";
import {
	CURRENCIES,
	CURRENCY_SYMBOLS,
	type ProjectInput,
	projectSchema,
} from "./schema";

const MAX_PHOTOS = 3;
const MAX_AREAS = 3;

type Photo = { url: string; caption: string };

export type ProjectFormInitial = {
	name: string;
	quickSolution: string;
	about: string;
	website: string;
	country: string;
	areaIds: string[];
	currency: string;
	investmentGoal: string;
	startInvestment: string;
	equity: string;
	annualRevenue: string;
	monthsToReturn: string;
	investorSlots: string;
	logo: string;
	videoPitchUrl: string;
	photos: Photo[];
};

const EMPTY: ProjectFormInitial = {
	name: "",
	quickSolution: "",
	about: "",
	website: "",
	country: "",
	areaIds: [],
	currency: "EUR",
	investmentGoal: "",
	startInvestment: "",
	equity: "",
	annualRevenue: "",
	monthsToReturn: "",
	investorSlots: "",
	logo: "",
	videoPitchUrl: "",
	photos: [],
};

const FIELD_ERROR_KEYS = {
	name: "projErrName",
	areaIds: "projErrSectors",
	investmentGoal: "projErrInvestmentGoal",
	equity: "projErrEquity",
} as const;

function toOptionalInt(value: string): number | null {
	return value.trim() === "" ? null : Math.round(Number(value));
}

function toOptionalFloat(value: string): number | null {
	return value.trim() === "" ? null : Number(value);
}

export function ProjectForm({
	areas,
	projectId,
	initial,
	title,
	subtitle,
	headerAction,
}: {
	areas: { id: string; name: string }[];
	projectId?: string;
	initial?: ProjectFormInitial;
	title: string;
	subtitle?: string;
	headerAction?: React.ReactNode;
}) {
	const t = useTranslation();
	const router = useRouter();
	const [form, setForm] = useState<ProjectFormInitial>(initial ?? EMPTY);
	const [uploading, setUploading] = useState<"logo" | "photo" | "video" | null>(
		null,
	);
	const [isPending, startTransition] = useTransition();
	const [recordOpen, setRecordOpen] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const logoInput = useRef<HTMLInputElement>(null);
	const photoInput = useRef<HTMLInputElement>(null);
	const videoInput = useRef<HTMLInputElement>(null);
	const areasAnchor = useComboboxAnchor();
	const [activeSection, setActiveSection] = useState("proj-basics");

	const selectedAreas = areas.filter((a) => form.areaIds.includes(a.id));

	const requiredChecks = [
		form.name.trim().length >= 2,
		form.areaIds.length > 0,
		Number(form.investmentGoal) > 0,
	];
	const requiredLeft = requiredChecks.filter((ok) => !ok).length;
	const completionChecks = [
		...requiredChecks,
		form.quickSolution.trim() !== "",
		form.about.trim() !== "",
		form.website.trim() !== "",
		form.country !== "",
		form.logo !== "",
		form.photos.length > 0,
		form.videoPitchUrl !== "",
	];
	const completionPct = Math.round(
		(completionChecks.filter(Boolean).length / completionChecks.length) * 100,
	);

	const sections = [
		{ id: "proj-basics", label: t("projBasics"), Icon: InfoIcon },
		{ id: "proj-investment", label: t("projInvestment"), Icon: TrendingUpIcon },
		{ id: "proj-media", label: t("projMedia"), Icon: ImageIcon },
	];

	function goTo(id: string) {
		setActiveSection(id);
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	}

	function set(patch: Partial<ProjectFormInitial>) {
		setForm((prev) => ({ ...prev, ...patch }));
		setErrors((prev) => {
			const next = { ...prev };
			for (const key of Object.keys(patch)) delete next[key];
			return next;
		});
	}

	async function upload(kind: UploadKind, file: File): Promise<string | null> {
		const invalid = validateMediaFile(kind, file);
		if (invalid) {
			toast.error(t(invalid));
			return null;
		}
		const signed = await createUploadUrl(kind, file.type);
		if (!signed.ok) {
			toast.error(signed.error);
			return null;
		}
		try {
			await uploadToSignedUrl(signed.path, signed.token, file);
			return signed.publicUrl;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t("projUploadFailed"));
			return null;
		}
	}

	async function handleFile(
		slot: "logo" | "photo" | "video",
		file: File | undefined,
	) {
		if (!file || uploading) return;
		setUploading(slot);
		try {
			const url = await upload(slot === "video" ? "video" : "image", file);
			if (!url) return;
			if (slot === "logo") set({ logo: url });
			else if (slot === "video") set({ videoPitchUrl: url });
			else
				setForm((prev) => ({
					...prev,
					photos: [...prev.photos, { url, caption: "" }],
				}));
		} finally {
			setUploading(null);
		}
	}

	function setCaption(index: number, caption: string) {
		set({
			photos: form.photos.map((p, i) => (i === index ? { ...p, caption } : p)),
		});
	}

	function removePhoto(index: number) {
		set({ photos: form.photos.filter((_, i) => i !== index) });
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		const input: ProjectInput = {
			name: form.name,
			quickSolution: form.quickSolution,
			about: form.about,
			website: form.website,
			country: form.country,
			areaIds: form.areaIds,
			currency: form.currency as (typeof CURRENCIES)[number],
			investmentGoal: Math.round(Number(form.investmentGoal)) || 0,
			startInvestment: toOptionalInt(form.startInvestment),
			equity: toOptionalFloat(form.equity),
			annualRevenue: toOptionalInt(form.annualRevenue),
			monthsToReturn: toOptionalInt(form.monthsToReturn),
			investorSlots: toOptionalInt(form.investorSlots),
			logo: form.logo,
			videoPitchUrl: form.videoPitchUrl,
			media: form.photos.map((p) => ({
				type: "PHOTO" as const,
				url: p.url,
				caption: p.caption,
			})),
		};
		const parsed = projectSchema.safeParse(input);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const field = String(issue.path[0] ?? "");
				if (!next[field]) {
					next[field] =
						field in FIELD_ERROR_KEYS
							? t(FIELD_ERROR_KEYS[field as keyof typeof FIELD_ERROR_KEYS])
							: t("errInvalidInput");
				}
			}
			setErrors(next);
			const first = Object.keys(next)[0];
			const el = document.getElementById(
				first === "areaIds" ? "sectors" : first,
			);
			el?.scrollIntoView({ behavior: "smooth", block: "center" });
			el?.focus({ preventScroll: true });
			return;
		}
		setErrors({});
		startTransition(async () => {
			const result = projectId
				? await updateProject(projectId, input)
				: await createProject(input);
			if (result.ok) {
				toast.success(
					projectId ? t("projProjectSaved") : t("projProjectCreated"),
				);
				router.push("/projects");
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	}

	const currencySymbol =
		CURRENCY_SYMBOLS[form.currency as (typeof CURRENCIES)[number]] ?? "€";

	return (
		<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[236px_1fr]">
				<aside className="flex flex-col gap-2 self-start lg:sticky lg:top-24">
					<div className="mb-2">
						<h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
						{subtitle && (
							<p className="mt-0.5 text-muted-foreground text-sm">{subtitle}</p>
						)}
						{headerAction && <div className="mt-3">{headerAction}</div>}
					</div>
					<nav className="hidden flex-col gap-1 lg:flex">
						{sections.map(({ id, label, Icon }) => (
							<button
								key={id}
								type="button"
								onClick={() => goTo(id)}
								className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-sm transition-colors ${
									activeSection === id
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-accent hover:text-foreground"
								}`}
							>
								<Icon className="size-4 shrink-0" />
								{label}
							</button>
						))}
					</nav>
					<div className="mt-2 hidden rounded-xl border bg-card p-4 lg:block">
						<div className="font-medium text-muted-foreground text-xs">
							{t("projCompletion")}
						</div>
						<Progress value={completionPct} className="my-2.5" />
						<div className="text-muted-foreground text-xs">
							{completionPct}% · {requiredLeft} {t("projRequiredFieldsLeft")}
						</div>
					</div>
				</aside>

				<div className="flex flex-col gap-6">
					<Card id="proj-basics" className="scroll-mt-24">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<InfoIcon className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5">
									<CardTitle>{t("projBasics")}</CardTitle>
									<CardDescription>{t("projBasicsDesc")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<Label htmlFor="name">{t("projProjectName")} *</Label>
									<Input
										id="name"
										value={form.name}
										onChange={(e) => set({ name: e.target.value })}
										placeholder={t("projProjectNamePlaceholder")}
										aria-invalid={errors.name ? true : undefined}
										required
									/>
									{errors.name && (
										<p className="text-destructive text-sm">{errors.name}</p>
									)}
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="website">{t("projWebsite")}</Label>
									<Input
										id="website"
										value={form.website}
										onChange={(e) => set({ website: e.target.value })}
										placeholder="https://…"
									/>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="quickSolution">{t("projOneLinePitch")}</Label>
									<span className="text-muted-foreground text-xs">
										{form.quickSolution.length}/250
									</span>
								</div>
								<Input
									id="quickSolution"
									value={form.quickSolution}
									onChange={(e) => set({ quickSolution: e.target.value })}
									placeholder={t("projOneLinePitchPlaceholder")}
									maxLength={250}
								/>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="about">{t("projAbout")}</Label>
									<span className="text-muted-foreground text-xs">
										{form.about.length}/2000
									</span>
								</div>
								<Textarea
									id="about"
									value={form.about}
									onChange={(e) => set({ about: e.target.value })}
									placeholder={t("projAboutPlaceholder")}
									rows={5}
									maxLength={2000}
								/>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="sectors">
									{t("projSectors")} *{" "}
									<span className="font-normal text-muted-foreground">
										({form.areaIds.length}/{MAX_AREAS})
									</span>
								</Label>
								<Combobox
									multiple
									items={areas}
									value={selectedAreas}
									onValueChange={(next: { id: string; name: string }[]) =>
										set({ areaIds: next.slice(0, MAX_AREAS).map((a) => a.id) })
									}
									itemToStringLabel={(area: { id: string; name: string }) =>
										area.name
									}
									isItemEqualToValue={(a, b) => a.id === b.id}
								>
									<ComboboxChips ref={areasAnchor}>
										<ComboboxValue>
											{(value: { id: string; name: string }[]) => (
												<>
													{value.map((area) => (
														<ComboboxChip key={area.id}>
															{area.name}
														</ComboboxChip>
													))}
													<ComboboxChipsInput
														id="sectors"
														placeholder={
															value.length === 0 ? t("projSearchSectors") : ""
														}
													/>
												</>
											)}
										</ComboboxValue>
									</ComboboxChips>
									<ComboboxContent anchor={areasAnchor}>
										<ComboboxEmpty>{t("projNoSectorFound")}</ComboboxEmpty>
										<ComboboxList>
											{(area: { id: string; name: string }) => (
												<ComboboxItem
													key={area.id}
													value={area}
													disabled={
														form.areaIds.length >= MAX_AREAS &&
														!form.areaIds.includes(area.id)
													}
												>
													{area.name}
												</ComboboxItem>
											)}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
								{errors.areaIds && (
									<p className="text-destructive text-sm">{errors.areaIds}</p>
								)}
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<Label htmlFor="country">{t("projCountry")}</Label>
									<NativeSelect
										id="country"
										className="w-full"
										value={form.country}
										onChange={(e) => set({ country: e.target.value })}
									>
										<NativeSelectOption value="">
											{t("projSelectCountry")}
										</NativeSelectOption>
										{COUNTRIES.map((c) => (
											<NativeSelectOption key={c} value={c}>
												{t(COUNTRY_LABEL_KEYS[c])}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card id="proj-investment" className="scroll-mt-24">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<TrendingUpIcon className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5">
									<CardTitle>{t("projInvestment")}</CardTitle>
									<CardDescription>{t("projInvestmentDesc")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<div className="flex flex-col gap-2">
								<Label htmlFor="currency">{t("projCurrency")} *</Label>
								<NativeSelect
									id="currency"
									className="w-full"
									value={form.currency}
									onChange={(e) => set({ currency: e.target.value })}
								>
									{CURRENCIES.map((c) => (
										<NativeSelectOption key={c} value={c}>
											{c} ({CURRENCY_SYMBOLS[c]})
										</NativeSelectOption>
									))}
								</NativeSelect>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="investmentGoal">
									{t("projInvestmentGoal")} ({currencySymbol}) *
								</Label>
								<Input
									id="investmentGoal"
									type="number"
									min={1}
									value={form.investmentGoal}
									onChange={(e) => set({ investmentGoal: e.target.value })}
									placeholder="500000"
									aria-invalid={errors.investmentGoal ? true : undefined}
									required
								/>
								{errors.investmentGoal && (
									<p className="text-destructive text-sm">
										{errors.investmentGoal}
									</p>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="startInvestment">
									{t("projMinimumTicket")} ({currencySymbol})
								</Label>
								<Input
									id="startInvestment"
									type="number"
									min={0}
									value={form.startInvestment}
									onChange={(e) => set({ startInvestment: e.target.value })}
									placeholder="50000"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="equity">{t("projEquityOffered")} (%)</Label>
								<Input
									id="equity"
									type="number"
									min={0}
									max={100}
									step="0.1"
									value={form.equity}
									onChange={(e) => set({ equity: e.target.value })}
									placeholder="10"
									aria-invalid={errors.equity ? true : undefined}
								/>
								{errors.equity && (
									<p className="text-destructive text-sm">{errors.equity}</p>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="annualRevenue">
									{t("projAnnualRevenue")} ({currencySymbol})
								</Label>
								<Input
									id="annualRevenue"
									type="number"
									min={0}
									value={form.annualRevenue}
									onChange={(e) => set({ annualRevenue: e.target.value })}
									placeholder="120000"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="monthsToReturn">
									{t("projMonthsToReturn")}
								</Label>
								<Input
									id="monthsToReturn"
									type="number"
									min={1}
									value={form.monthsToReturn}
									onChange={(e) => set({ monthsToReturn: e.target.value })}
									placeholder="24"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="investorSlots">{t("projInvestorSlots")}</Label>
								<Input
									id="investorSlots"
									type="number"
									min={1}
									value={form.investorSlots}
									onChange={(e) => set({ investorSlots: e.target.value })}
									placeholder="5"
								/>
							</div>
						</CardContent>
					</Card>

					<Card id="proj-media" className="scroll-mt-24">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<ImageIcon className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5">
									<CardTitle>{t("projMedia")}</CardTitle>
									<CardDescription>
										{t("projMediaDescPrefix")} {MAX_PHOTOS}{" "}
										{t("projMediaDescSuffix")}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex flex-col gap-6">
							<div className="flex flex-wrap items-center gap-4">
								{form.logo ? (
									// biome-ignore lint/performance/noImgElement: supabase storage preview
									<img
										src={form.logo}
										alt={t("projProjectLogo")}
										className="size-16 rounded-md border object-cover"
									/>
								) : (
									<div className="flex size-16 items-center justify-center rounded-md border border-dashed">
										<ImageIcon className="size-6 text-muted-foreground" />
									</div>
								)}
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={uploading !== null}
										onClick={() => logoInput.current?.click()}
									>
										{uploading === "logo" ? (
											<Loader2Icon className="animate-spin" />
										) : (
											<ImageIcon />
										)}
										{form.logo ? t("projChangeLogo") : t("projUploadLogo")}
									</Button>
									{form.logo && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => set({ logo: "" })}
										>
											<XIcon /> {t("projRemove")}
										</Button>
									)}
								</div>
								<input
									ref={logoInput}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="hidden"
									onChange={(e) => {
										void handleFile("logo", e.target.files?.[0]);
										e.target.value = "";
									}}
								/>
							</div>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div className="flex flex-col gap-3">
									<Label>
										{t("projPhotos")}{" "}
										<span className="font-normal text-muted-foreground">
											({form.photos.length}/{MAX_PHOTOS})
										</span>
									</Label>
									<input
										ref={photoInput}
										type="file"
										accept="image/jpeg,image/png,image/webp"
										className="hidden"
										onChange={(e) => {
											void handleFile("photo", e.target.files?.[0]);
											e.target.value = "";
										}}
									/>
									<div className="grid grid-cols-1 gap-3">
										{form.photos.map((photo, index) => (
											<div key={photo.url} className="flex flex-col gap-2">
												<div className="relative">
													{/* biome-ignore lint/performance/noImgElement: supabase storage preview */}
													<img
														src={photo.url}
														alt={
															photo.caption || `${t("projPhoto")} ${index + 1}`
														}
														className="aspect-video w-full rounded-md border object-cover"
													/>
													<Button
														type="button"
														variant="secondary"
														size="icon"
														aria-label={t("projRemovePhoto")}
														className="absolute top-2 right-2 size-7"
														onClick={() => removePhoto(index)}
													>
														<XIcon />
													</Button>
												</div>
												<Input
													value={photo.caption}
													onChange={(e) => setCaption(index, e.target.value)}
													placeholder={t("projCaptionPlaceholder")}
													maxLength={50}
												/>
											</div>
										))}
										{form.photos.length < MAX_PHOTOS && (
											<button
												type="button"
												disabled={uploading !== null}
												onClick={() => photoInput.current?.click()}
												onDragOver={(e) => e.preventDefault()}
												onDrop={(e) => {
													e.preventDefault();
													void handleFile("photo", e.dataTransfer.files?.[0]);
												}}
												className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-input border-dashed text-muted-foreground text-sm transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
											>
												{uploading === "photo" ? (
													<Loader2Icon className="size-5 animate-spin" />
												) : (
													<ImageIcon className="size-5" />
												)}
												{t("projAddPhoto")}
											</button>
										)}
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<Label>{t("projPitchVideo")}</Label>
									{form.videoPitchUrl ? (
										<div className="flex flex-col items-center gap-2">
											{/* biome-ignore lint/a11y/useMediaCaption: user-uploaded pitch video */}
											<video
												src={form.videoPitchUrl}
												controls
												className="aspect-video w-full max-w-xl rounded-md border bg-black object-cover"
											/>
											<div>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => set({ videoPitchUrl: "" })}
												>
													<XIcon /> {t("projRemoveVideo")}
												</Button>
											</div>
										</div>
									) : (
										<button
											type="button"
											disabled={uploading !== null}
											onClick={() => setRecordOpen(true)}
											onDragOver={(e) => e.preventDefault()}
											onDrop={(e) => {
												e.preventDefault();
												void handleFile("video", e.dataTransfer.files?.[0]);
											}}
											className="flex w-full items-center justify-center gap-3 rounded-md border border-input border-dashed p-6 text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
										>
											{uploading === "video" ? (
												<Loader2Icon className="size-6 animate-spin" />
											) : (
												<VideoIcon className="size-6" />
											)}
											<span className="flex flex-col text-left">
												<span className="font-medium text-foreground text-sm">
													{t("projAddVideo")}
												</span>
												<span className="text-muted-foreground text-xs">
													{t("projVideoHint")}
												</span>
											</span>
										</button>
									)}
									<RecordVideoDialog
										open={recordOpen}
										onOpenChange={setRecordOpen}
										onRecorded={(file) => void handleFile("video", file)}
										onUploadClick={() => videoInput.current?.click()}
									/>
									<input
										ref={videoInput}
										type="file"
										accept="video/mp4,video/webm,video/quicktime"
										className="hidden"
										onChange={(e) => {
											void handleFile("video", e.target.files?.[0]);
											e.target.value = "";
										}}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="sticky bottom-4 z-10 pb-[env(safe-area-inset-bottom)]">
				<div className="flex flex-col gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
					<div className="hidden px-2 text-muted-foreground text-sm sm:block">
						{completionPct}% · {requiredLeft} {t("projRequiredFieldsLeft")}
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							type="button"
							variant="ghost"
							className="w-full sm:w-auto"
							onClick={() => router.push("/projects")}
						>
							{t("commonCancel")}
						</Button>
						<Button
							type="submit"
							className="w-full sm:w-auto"
							disabled={isPending || uploading !== null}
						>
							{isPending
								? t("commonSaving")
								: projectId
									? t("projSaveChanges")
									: t("projCreateProject")}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}
