"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, PROJECT_MEDIA_BUCKET } from "@/lib/supabase/server";
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
	const user = await requireEntrepreneur();
	if (!user) return { ok: false, error: "Not authorized" };

	const allowed = kind === "image" ? IMAGE_MIMES : VIDEO_MIMES;
	const ext = EXT_BY_MIME[contentType];
	if (!allowed.includes(contentType) || !ext) {
		return { ok: false, error: "Unsupported file type" };
	}

	try {
		const storage = getSupabaseAdmin().storage.from(PROJECT_MEDIA_BUCKET);
		const path = `${user.id}/${randomUUID()}.${ext}`;
		const { data, error } = await storage.createSignedUploadUrl(path);
		if (error || !data) {
			return { ok: false, error: error?.message ?? "Could not sign upload" };
		}
		const { data: pub } = storage.getPublicUrl(path);
		return { ok: true, path, token: data.token, publicUrl: pub.publicUrl };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not sign upload",
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
	const user = await requireEntrepreneur();
	if (!user) return { ok: false, error: "Not authorized" };

	const parsed = projectSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Invalid project data",
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
		return { ok: false, error: "Could not create the project" };
	}
}

async function findOwnedProject(id: string) {
	const user = await requireEntrepreneur();
	if (!user) return null;
	const project = await prisma.project.findUnique({
		where: { id },
		select: { id: true, entrepreneurId: true },
	});
	if (!project) return null;
	if (project.entrepreneurId !== user.id && user.role !== "ADMIN") return null;
	return project;
}

export async function updateProject(
	id: string,
	input: ProjectInput,
): Promise<ProjectActionResult> {
	const project = await findOwnedProject(id);
	if (!project) return { ok: false, error: "Project not found" };

	const parsed = projectSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Invalid project data",
		};
	}

	try {
		await prisma.project.update({
			where: { id },
			data: {
				...projectData(parsed.data),
				areas: { set: areaRefs(parsed.data) },
				media: { deleteMany: {}, create: mediaCreate(parsed.data) },
			},
		});
		revalidateProjectPaths(id);
		return { ok: true, id };
	} catch {
		return { ok: false, error: "Could not save the project" };
	}
}

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function setProjectStatus(
	id: string,
	status: z.input<typeof statusSchema>,
): Promise<ProjectActionResult> {
	const project = await findOwnedProject(id);
	if (!project) return { ok: false, error: "Project not found" };

	const parsed = statusSchema.safeParse(status);
	if (!parsed.success) return { ok: false, error: "Invalid status" };

	try {
		await prisma.project.update({
			where: { id },
			data: { status: parsed.data },
		});
		revalidateProjectPaths(id);
		return { ok: true, id };
	} catch {
		return { ok: false, error: "Could not update the project status" };
	}
}

function storagePathFromUrl(url: string): string | null {
	const marker = `/${PROJECT_MEDIA_BUCKET}/`;
	const index = url.indexOf(marker);
	if (index === -1) return null;
	return url.slice(index + marker.length);
}

export async function deleteProject(id: string): Promise<ProjectActionResult> {
	const project = await findOwnedProject(id);
	if (!project) return { ok: false, error: "Project not found" };

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
		return { ok: false, error: "Could not delete the project" };
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
