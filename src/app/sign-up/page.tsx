import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
	return (
		<AuthShell
			title="Create your account"
			description="Join Im-Vestor Leads as an entrepreneur or investor."
		>
			<SignUpForm />
		</AuthShell>
	);
}
