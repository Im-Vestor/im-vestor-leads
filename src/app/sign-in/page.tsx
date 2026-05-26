import { AuthShell } from "@/components/auth-shell";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
	return (
		<AuthShell
			title="Welcome back"
			description="Sign in to continue to Im-Vestor Leads."
		>
			<SignInForm />
		</AuthShell>
	);
}
