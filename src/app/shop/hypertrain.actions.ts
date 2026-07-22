"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HYPERTRAIN_DAYS } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";

export type HypertrainResult = { ok: true } | { ok: false; error: string };

function boostUntil(): Date {
	return new Date(Date.now() + HYPERTRAIN_DAYS * 24 * 60 * 60 * 1000);
}

function isActive(until: Date | null): boolean {
	return until !== null && until.getTime() > Date.now();
}

async function spendTicket(userId: string): Promise<boolean> {
	const res = await prisma.user.updateMany({
		where: { id: userId, hypertrainTickets: { gt: 0 } },
		data: { hypertrainTickets: { decrement: 1 } },
	});
	return res.count > 0;
}

export async function applyHypertrainToProject(
	projectId: string,
): Promise<HypertrainResult> {
	const t = await getT();
	const user = await getCurrentUser();
	if (!user) return { ok: false, error: t("errNotAuthorized") };

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { entrepreneurId: true, status: true, hypertrainUntil: true },
	});
	if (
		!project ||
		(project.entrepreneurId !== user.id && user.role !== "ADMIN")
	) {
		return { ok: false, error: t("errProjectNotFound") };
	}
	if (project.status !== "PUBLISHED") {
		return { ok: false, error: t("errHyperNotPublished") };
	}
	if (isActive(project.hypertrainUntil)) {
		return { ok: false, error: t("errHyperAlreadyActive") };
	}

	if (!(await spendTicket(user.id))) {
		return { ok: false, error: t("errHyperNoTickets") };
	}
	try {
		await prisma.project.update({
			where: { id: projectId },
			data: { hypertrainUntil: boostUntil() },
		});
	} catch {
		await prisma.user.update({
			where: { id: user.id },
			data: { hypertrainTickets: { increment: 1 } },
		});
		return { ok: false, error: t("errHyperFailed") };
	}

	revalidatePath("/dashboard");
	revalidatePath(`/projects/${projectId}`);
	revalidatePath("/shop");
	return { ok: true };
}

export async function applyHypertrainToProfile(): Promise<HypertrainResult> {
	const t = await getT();
	const user = await getCurrentUser();
	if (!user) return { ok: false, error: t("errNotAuthorized") };
	if (user.role !== "INVESTOR") {
		return { ok: false, error: t("errHyperInvestorOnly") };
	}
	if (isActive(user.hypertrainUntil)) {
		return { ok: false, error: t("errHyperAlreadyActive") };
	}

	if (!(await spendTicket(user.id))) {
		return { ok: false, error: t("errHyperNoTickets") };
	}
	try {
		await prisma.user.update({
			where: { id: user.id },
			data: { hypertrainUntil: boostUntil() },
		});
	} catch {
		await prisma.user.update({
			where: { id: user.id },
			data: { hypertrainTickets: { increment: 1 } },
		});
		return { ok: false, error: t("errHyperFailed") };
	}

	revalidatePath("/dashboard");
	revalidatePath("/shop");
	return { ok: true };
}
