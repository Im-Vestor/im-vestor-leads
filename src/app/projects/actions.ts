"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { banPhrase } from "@/lib/messages/banned-words";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, PROJECT_MEDIA_BUCKET } from "@/lib/supabase/server";
import { getT } from "@/utils/translations/server";
import { requireEntrepreneur } from "./_entrepreneur-guard";
import { type ProjectInput, projectSchema } from "./schema";

export type ProjectActionResult =
	| { ok: true; id?: string }
	| { ok: false; error: string };

const EXT_BY_MIME: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"video/mp4": "mp4",
	"video/webm": "webm",
	"video/quicktime": "mov",
};

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];

export type UploadUrlResult =
	| { ok: true; path: string; token: string; publicUrl: string }
	| { ok: false; error: string };

export async function createUploadUrl(
	kind: "image" | "video",
	contentType: string,
): Promise<UploadUrlResult> {
	const t = await getT();
	const user = await requireEntrepreneur();
	if (!user) return { ok: false, error: t("errNotAuthorized") };

	const allowed = kind === "image" ? IMAGE_MIMES : VIDEO_MIMES;
	const ext = EXT_BY_MIME[contentType];
	if (!allowed.includes(contentType) || !ext) {
		return { ok: false, error: t("errUnsupportedFileType") };
	}

	try {
		const storage = getSupabaseAdmin().storage.from(PROJECT_MEDIA_BUCKET);
		const path = `${user.id}/${randomUUID()}.${ext}`;
		const { data, error } = await storage.createSignedUploadUrl(path);
		if (error || !data) {
			return { ok: false, error: error?.message ?? t("errCouldNotSignUpload") };
		}
		const { data: pub } = storage.getPublicUrl(path);
		return { ok: true, path, token: data.token, publicUrl: pub.publicUrl };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : t("errCouldNotSignUpload"),
		};
	}
}

function nullable(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function projectData(data: z.output<typeof projectSchema>) {
	return {
		name: data.name.trim(),
		quickSolution: nullable(data.quickSolution),
		about: nullable(data.about),
		website: nullable(data.website),
		country: nullable(data.country),
		currency: data.currency,
		investmentGoal: data.investmentGoal,
		startInvestment: data.startInvestment ?? null,
		equity: data.equity ?? null,
		annualRevenue: data.annualRevenue ?? null,
		monthsToReturn: data.monthsToReturn ?? null,
		investorSlots: data.investorSlots ?? null,
		logo: nullable(data.logo),
		videoPitchUrl: nullable(data.videoPitchUrl),
	};
}

function areaRefs(data: z.output<typeof projectSchema>) {
	return [...new Set(data.areaIds)].map((id) => ({ id }));
}

function mediaCreate(data: z.output<typeof projectSchema>) {
	return data.media.map((m, index) => ({
		type: m.type,
		url: m.url,
		caption: nullable(m.caption),
		order: index,
	}));
}

function revalidateProjectPaths(id?: string) {
	revalidatePath("/projects");
	if (id) revalidatePath(`/projects/${id}`);
	revalidatePath("/dashboard");
}

export async function createProject(
	input: ProjectInput,
): Promise<ProjectActionResult> {
	const t = await getT();
	const user = await requireEntrepreneur();
	if (!user) return { ok: false, error: t("errNotAuthorized") };

	const parsed = projectSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: t("errInvalidProjectData"),
		};
	}

	try {
		const project = await prisma.project.create({
			data: {
				...projectData(parsed.data),
				entrepreneurId: user.id,
				areas: { connect: areaRefs(parsed.data) },
				media: { create: mediaCreate(parsed.data) },
			},
			select: { id: true },
		});
		revalidateProjectPaths(project.id);
		return { ok: true, id: project.id };
	} catch {
		return { ok: false, error: t("errCouldNotCreateProject") };
	}
}

async function findOwnedProject(id: string) {
	const user = await requireEntrepreneur();
	if (!user) return null;
	const project = await prisma.project.findUnique({
		where: { id },
		select: { id: true, entrepreneurId: true, status: true },
	});
	if (!project) return null;
	if (project.entrepreneurId !== user.id && user.role !== "ADMIN") return null;
	return project;
}

export async function updateProject(
	id: string,
	input: ProjectInput,
): Promise<ProjectActionResult> {
	const t = await getT();
	const project = await findOwnedProject(id);
	if (!project) return { ok: false, error: t("errProjectNotFound") };

	const parsed = projectSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: t("errInvalidProjectData"),
		};
	}

	const before = await prisma.project.findUnique({
		where: { id },
		select: {
			logo: true,
			videoPitchUrl: true,
			media: { select: { url: true } },
		},
	});

	try {
		await prisma.project.update({
			where: { id },
			data: {
				...projectData(parsed.data),
				areas: { set: areaRefs(parsed.data) },
				media: { deleteMany: {}, create: mediaCreate(parsed.data) },
			},
		});
		if (project.status === "PUBLISHED") {
			await banPhrase(parsed.data.name, project.entrepreneurId);
		}

		// Best-effort storage cleanup of files no longer referenced.
		const kept = new Set(
			[
				parsed.data.logo,
				parsed.data.videoPitchUrl,
				...parsed.data.media.map((m) => m.url),
			].filter(Boolean),
		);
		const removed = [
			before?.logo,
			before?.videoPitchUrl,
			...(before?.media.map((m) => m.url) ?? []),
		]
			.filter((u): u is string => Boolean(u) && !kept.has(u as string))
			.map(storagePathFromUrl)
			.filter((p): p is string => Boolean(p));
		if (removed.length > 0) {
			try {
				await getSupabaseAdmin()
					.storage.from(PROJECT_MEDIA_BUCKET)
					.remove(removed);
			} catch {
				// ignore — orphaned files are harmless
			}
		}

		revalidateProjectPaths(id);
		return { ok: true, id };
	} catch {
		return { ok: false, error: t("errCouldNotSaveProject") };
	}
}

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function setProjectStatus(
	id: string,
	status: z.input<typeof statusSchema>,
): Promise<ProjectActionResult> {
	const t = await getT();
	const project = await findOwnedProject(id);
	if (!project) return { ok: false, error: t("errProjectNotFound") };

	const parsed = statusSchema.safeParse(status);
	if (!parsed.success) return { ok: false, error: t("errInvalidStatus") };

	try {
		const updated = await prisma.project.update({
			where: { id },
			data: { status: parsed.data },
			select: { name: true },
		});
		if (parsed.data === "PUBLISHED") {
			await banPhrase(updated.name, project.entrepreneurId);
		}
		revalidateProjectPaths(id);
		return { ok: true, id };
	} catch {
		return { ok: false, error: t("errCouldNotUpdateStatus") };
	}
}

function storagePathFromUrl(url: string): string | null {
	const marker = `/${PROJECT_MEDIA_BUCKET}/`;
	const index = url.indexOf(marker);
	if (index === -1) return null;
	return url.slice(index + marker.length);
}

export async function deleteProject(id: string): Promise<ProjectActionResult> {
	const t = await getT();
	const project = await findOwnedProject(id);
	if (!project) return { ok: false, error: t("errProjectNotFound") };

	const full = await prisma.project.findUnique({
		where: { id },
		select: {
			logo: true,
			videoPitchUrl: true,
			media: { select: { url: true } },
		},
	});

	try {
		await prisma.project.delete({ where: { id } });
	} catch {
		return { ok: false, error: t("errCouldNotDeleteProject") };
	}

	// Best-effort storage cleanup; DB row is already gone.
	const paths = [
		full?.logo,
		full?.videoPitchUrl,
		...(full?.media.map((m) => m.url) ?? []),
	]
		.filter((u): u is string => Boolean(u))
		.map(storagePathFromUrl)
		.filter((p): p is string => Boolean(p));
	if (paths.length > 0) {
		try {
			await getSupabaseAdmin().storage.from(PROJECT_MEDIA_BUCKET).remove(paths);
		} catch {
			// ignore — orphaned files are harmless
		}
	}

	revalidateProjectPaths(id);
	return { ok: true };
}
