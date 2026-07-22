"use server";

import { revalidatePath } from "next/cache";
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

	revalidatePath("/dashboard");
	revalidatePath(`/projects/${projectId}`);
	return { ok: true, alreadyUnlocked: false };
}
