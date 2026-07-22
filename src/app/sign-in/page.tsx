import { AuthShell } from "@/components/auth-shell";
import { getT } from "@/utils/translations/server";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
	const t = await getT();
	return (
		<AuthShell
			title={t("authWelcomeBack")}
			description={t("authSignInDescription")}
		>
			<SignInForm />
		</AuthShell>
	);
}
