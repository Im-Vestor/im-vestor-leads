import { AuthShell } from "@/components/auth-shell";
import { getT } from "@/utils/translations/server";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ ref?: string | string[] }>;
}) {
	const t = await getT();
	const { ref } = await searchParams;
	return (
		<AuthShell
			title={t("authCreateAccount")}
			description={t("authJoinDescription")}
		>
			<SignUpForm initialRef={Array.isArray(ref) ? ref[0] : ref} />
		</AuthShell>
	);
}
