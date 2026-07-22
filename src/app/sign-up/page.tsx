import { AuthShell } from "@/components/auth-shell";
import { getT } from "@/utils/translations/server";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage() {
	const t = await getT();
	return (
		<AuthShell
			title={t("authCreateAccount")}
			description={t("authJoinDescription")}
		>
			<SignUpForm />
		</AuthShell>
	);
}
