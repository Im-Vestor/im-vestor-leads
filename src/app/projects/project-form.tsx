"use client";

import { ImageIcon, Loader2Icon, VideoIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/constants";
import {
	type UploadKind,
	uploadToSignedUrl,
	validateMediaFile,
} from "@/lib/supabase/storage";
import { createProject, createUploadUrl, updateProject } from "./actions";
import { CURRENCIES, CURRENCY_SYMBOLS, type ProjectInput } from "./schema";

const MAX_PHOTOS = 4;
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
}: {
	areas: { id: string; name: string }[];
	projectId?: string;
	initial?: ProjectFormInitial;
}) {
	const router = useRouter();
	const [form, setForm] = useState<ProjectFormInitial>(initial ?? EMPTY);
	const [uploading, setUploading] = useState<"logo" | "photo" | "video" | null>(
		null,
	);
	const [isPending, startTransition] = useTransition();

	const logoInput = useRef<HTMLInputElement>(null);
	const photoInput = useRef<HTMLInputElement>(null);
	const videoInput = useRef<HTMLInputElement>(null);

	function set(patch: Partial<ProjectFormInitial>) {
		setForm((prev) => ({ ...prev, ...patch }));
	}

	async function upload(kind: UploadKind, file: File): Promise<string | null> {
		const invalid = validateMediaFile(kind, file);
		if (invalid) {
			toast.error(invalid);
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
			toast.error(err instanceof Error ? err.message : "Upload failed");
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
		startTransition(async () => {
			const result = projectId
				? await updateProject(projectId, input)
				: await createProject(input);
			if (result.ok) {
				toast.success(projectId ? "Project saved" : "Project created");
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
		<form onSubmit={onSubmit} className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Basics</CardTitle>
					<CardDescription>
						What the project is and where it operates.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="name">Project name *</Label>
							<Input
								id="name"
								value={form.name}
								onChange={(e) => set({ name: e.target.value })}
								placeholder="e.g. AgroSense"
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="website">Website</Label>
							<Input
								id="website"
								value={form.website}
								onChange={(e) => set({ website: e.target.value })}
								placeholder="https://…"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="quickSolution">One-line pitch</Label>
						<Input
							id="quickSolution"
							value={form.quickSolution}
							onChange={(e) => set({ quickSolution: e.target.value })}
							placeholder="What problem do you solve, in one sentence?"
							maxLength={200}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="about">About</Label>
						<Textarea
							id="about"
							value={form.about}
							onChange={(e) => set({ about: e.target.value })}
							placeholder="Tell investors about the product, market and team."
							rows={5}
							maxLength={2000}
						/>
					</div>

					<fieldset className="flex flex-col gap-2">
						<legend className="flex items-center gap-2 font-medium text-sm leading-none">
							Sectors *{" "}
							<span className="font-normal text-muted-foreground">
								(up to {MAX_AREAS})
							</span>
						</legend>
						<div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
							{areas.map((area) => {
								const checked = form.areaIds.includes(area.id);
								const disabled = !checked && form.areaIds.length >= MAX_AREAS;
								return (
									<Label
										key={area.id}
										className={`flex items-center gap-2 font-normal ${disabled ? "opacity-50" : ""}`}
									>
										<Checkbox
											checked={checked}
											disabled={disabled}
											onCheckedChange={(next) =>
												set({
													areaIds: next
														? [...form.areaIds, area.id]
														: form.areaIds.filter((id) => id !== area.id),
												})
											}
										/>
										{area.name}
									</Label>
								);
							})}
						</div>
					</fieldset>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="country">Country</Label>
							<NativeSelect
								id="country"
								className="w-full"
								value={form.country}
								onChange={(e) => set({ country: e.target.value })}
							>
								<NativeSelectOption value="">
									Select a country…
								</NativeSelectOption>
								{COUNTRIES.map((c) => (
									<NativeSelectOption key={c} value={c}>
										{c}
									</NativeSelectOption>
								))}
							</NativeSelect>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Investment</CardTitle>
					<CardDescription>
						The numbers investors will filter and evaluate by.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="flex flex-col gap-2">
						<Label htmlFor="currency">Currency *</Label>
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
							Investment goal ({currencySymbol}) *
						</Label>
						<Input
							id="investmentGoal"
							type="number"
							min={1}
							value={form.investmentGoal}
							onChange={(e) => set({ investmentGoal: e.target.value })}
							placeholder="500000"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="startInvestment">
							Minimum ticket ({currencySymbol})
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
						<Label htmlFor="equity">Equity offered (%)</Label>
						<Input
							id="equity"
							type="number"
							min={0}
							max={100}
							step="0.1"
							value={form.equity}
							onChange={(e) => set({ equity: e.target.value })}
							placeholder="10"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="annualRevenue">
							Annual revenue ({currencySymbol})
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
						<Label htmlFor="monthsToReturn">Months to return</Label>
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
						<Label htmlFor="investorSlots">Investor slots</Label>
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

			<Card>
				<CardHeader>
					<CardTitle>Media</CardTitle>
					<CardDescription>
						Logo, up to {MAX_PHOTOS} photos and a pitch video (max 50MB).
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<div className="flex items-center gap-4">
						{form.logo ? (
							// biome-ignore lint/performance/noImgElement: supabase storage preview
							<img
								src={form.logo}
								alt="Project logo"
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
								{form.logo ? "Change logo" : "Upload logo"}
							</Button>
							{form.logo && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => set({ logo: "" })}
								>
									<XIcon /> Remove
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

					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<Label>Photos</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={
									uploading !== null || form.photos.length >= MAX_PHOTOS
								}
								onClick={() => photoInput.current?.click()}
							>
								{uploading === "photo" ? (
									<Loader2Icon className="animate-spin" />
								) : (
									<ImageIcon />
								)}
								Add photo ({form.photos.length}/{MAX_PHOTOS})
							</Button>
						</div>
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
						{form.photos.length > 0 && (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{form.photos.map((photo, index) => (
									<div
										key={photo.url}
										className="flex flex-col gap-2 rounded-md border p-3"
									>
										{/* biome-ignore lint/performance/noImgElement: supabase storage preview */}
										<img
											src={photo.url}
											alt={photo.caption || `Photo ${index + 1}`}
											className="h-32 w-full rounded object-cover"
										/>
										<div className="flex gap-2">
											<Input
												value={photo.caption}
												onChange={(e) => setCaption(index, e.target.value)}
												placeholder="Caption (optional)"
												maxLength={50}
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												aria-label="Remove photo"
												onClick={() => removePhoto(index)}
											>
												<XIcon />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="flex flex-col gap-3">
						<Label>Pitch video</Label>
						{form.videoPitchUrl ? (
							<div className="flex flex-col gap-2">
								{/* biome-ignore lint/a11y/useMediaCaption: user-uploaded pitch video */}
								<video
									src={form.videoPitchUrl}
									controls
									className="max-h-64 w-full rounded-md border bg-black"
								/>
								<div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => set({ videoPitchUrl: "" })}
									>
										<XIcon /> Remove video
									</Button>
								</div>
							</div>
						) : (
							<div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={uploading !== null}
									onClick={() => videoInput.current?.click()}
								>
									{uploading === "video" ? (
										<Loader2Icon className="animate-spin" />
									) : (
										<VideoIcon />
									)}
									Upload pitch video
								</Button>
							</div>
						)}
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
				</CardContent>
			</Card>

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.push("/projects")}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isPending || uploading !== null}>
					{isPending
						? "Saving…"
						: projectId
							? "Save changes"
							: "Create project"}
				</Button>
			</div>
		</form>
	);
}
