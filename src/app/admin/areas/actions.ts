"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { notifyAreaRemoved } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type AdminArea = {
	id: string;
	name: string;
	projectCount: number;
	investorCount: number;
};

export async function listAreas(): Promise<ActionResult<AdminArea[]>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const areas = await prisma.area.findMany({
		orderBy: { name: "asc" },
		select: {
			id: true,
			name: true,
			_count: { select: { projects: true, investors: true } },
		},
	});

	return {
		ok: true,
		data: areas.map((a) => ({
			id: a.id,
			name: a.name,
			projectCount: a._count.projects,
			investorCount: a._count.investors,
		})),
	};
}

const nameSchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function addArea(
	input: z.input<typeof nameSchema>,
): Promise<ActionResult<AdminArea>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = nameSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	try {
		const area = await prisma.area.create({
			data: { name: parsed.data.name },
			select: { id: true, name: true },
		});
		revalidatePath("/admin/areas");
		return { ok: true, data: { ...area, projectCount: 0, investorCount: 0 } };
	} catch (err) {
		if ((err as { code?: string })?.code === "P2002") {
			return { ok: false, error: t("errAreaExists") };
		}
		return { ok: false, error: t("errCouldNotAddArea") };
	}
}

const idSchema = z.object({ id: z.string().min(1) });

export async function removeArea(
	input: z.input<typeof idSchema>,
): Promise<ActionResult<{ id: string }>> {
	const t = await getT();
	const admin = await requireAdmin();
	if (!admin) return { ok: false, error: t("errForbidden") };

	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: t("errInvalidInput") };

	// Collect who is affected BEFORE deleting — the join rows cascade away with it.
	const area = await prisma.area.findUnique({
		where: { id: parsed.data.id },
		select: {
			name: true,
			projects: {
				select: { entrepreneur: { select: { email: true, name: true } } },
			},
			investors: { select: { email: true, name: true } },
		},
	});
	if (!area) return { ok: false, error: t("errAreaNotFound") };

	try {
		await prisma.area.delete({ where: { id: parsed.data.id } });
	} catch {
		return { ok: false, error: t("errCouldNotRemoveArea") };
	}

	notifyAreaRemoved({
		areaName: area.name,
		recipients: [
			...area.projects.map((p) => ({
				...p.entrepreneur,
				ctaPath: "/projects",
			})),
			...area.investors.map((inv) => ({ ...inv, ctaPath: "/profile" })),
		],
	});

	revalidatePath("/admin/areas");
	return { ok: true, data: { id: parsed.data.id } };
}
