"use server";

import { revalidatePath } from "next/cache";
import { notifyLeadUnlocked } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";

export type UnlockResult =
	| { ok: true; alreadyUnlocked: boolean }
	| { ok: false; error: string };

export async function unlockProject(projectId: string): Promise<UnlockResult> {
	const t = await getT();
	const user = await getOrCreateUser();
	if (!user) return { ok: false, error: t("errNotAuthenticated") };
	if (user.role !== "INVESTOR" && user.role !== "ADMIN") {
		return { ok: false, error: t("errOnlyInvestorsUnlock") };
	}

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { status: true },
	});
	if (project?.status !== "PUBLISHED") {
		return { ok: false, error: t("errProjectNotFound") };
	}

	try {
		await prisma.$transaction(async (tx) => {
			await tx.projectUnlock.create({ data: { userId: user.id, projectId } });
			const spent = await tx.user.updateMany({
				where: { id: user.id, leadCredits: { gt: 0 } },
				data: { leadCredits: { decrement: 1 } },
			});
			if (spent.count === 0) throw new Error("NO_CREDITS");
		});
	} catch (err) {
		if ((err as { code?: string })?.code === "P2002") {
			return { ok: true, alreadyUnlocked: true };
		}
		if (err instanceof Error && err.message === "NO_CREDITS") {
			return {
				ok: false,
				error: t("errNoLeadCredits"),
			};
		}
		return { ok: false, error: t("errCouldNotUnlock") };
	}

	notifyLeadUnlocked({ projectId, investorId: user.id });

	revalidatePath("/dashboard");
	revalidatePath(`/projects/${projectId}`);
	return { ok: true, alreadyUnlocked: false };
}

// Entrepreneur side of the lead unlock: spend one credit to permanently reveal
// an investor's lead (and any preserved post-hypertrain chat). Mirrors unlockProject.
export async function unlockInvestor(
	investorId: string,
): Promise<UnlockResult> {
	const t = await getT();
	const user = await getOrCreateUser();
	if (!user) return { ok: false, error: t("errNotAuthenticated") };
	if (user.role !== "ENTREPRENEUR" && user.role !== "ADMIN") {
		return { ok: false, error: t("errNotAuthorized") };
	}

	const investor = await prisma.user.findUnique({
		where: { id: investorId },
		select: { role: true },
	});
	if (investor?.role !== "INVESTOR") {
		return { ok: false, error: t("errUserNotFound") };
	}

	try {
		await prisma.$transaction(async (tx) => {
			await tx.investorUnlock.create({
				data: { entrepreneurId: user.id, investorId },
			});
			const spent = await tx.user.updateMany({
				where: { id: user.id, leadCredits: { gt: 0 } },
				data: { leadCredits: { decrement: 1 } },
			});
			if (spent.count === 0) throw new Error("NO_CREDITS");
		});
	} catch (err) {
		if ((err as { code?: string })?.code === "P2002") {
			return { ok: true, alreadyUnlocked: true };
		}
		if (err instanceof Error && err.message === "NO_CREDITS") {
			return { ok: false, error: t("errNoLeadCredits") };
		}
		return { ok: false, error: t("errCouldNotUnlock") };
	}

	revalidatePath("/messages");
	return { ok: true, alreadyUnlocked: false };
}
