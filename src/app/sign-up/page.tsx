import { AuthShell } from "@/components/auth-shell";
import { prisma } from "@/lib/prisma";
import { getT } from "@/utils/translations/server";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ ref?: string | string[] }>;
}) {
	const t = await getT();
	const { ref } = await searchParams;
	const areas = await prisma.area.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});
	return (
		<AuthShell
			title={t("authCreateAccount")}
			description={t("authJoinDescription")}
		>
			<SignUpForm
				areas={areas}
				initialRef={Array.isArray(ref) ? ref[0] : ref}
			/>
		</AuthShell>
	);
}
