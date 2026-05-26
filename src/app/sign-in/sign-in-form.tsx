"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInFormProps = {
	/** Called after a successful sign-in. Defaults to navigating to /dashboard. */
	onSuccess?: () => void;
	/** When set, the "Sign up" link becomes an in-place toggle instead of a route change. */
	onSwitchToSignUp?: () => void;
};

export function SignInForm({
	onSuccess,
	onSwitchToSignUp,
}: SignInFormProps = {}) {
	const { signIn } = useSignIn();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			const attempt = await signIn.password({ identifier: email, password });
			if (attempt.error) {
				toast.error(clerkError(attempt.error) ?? "Could not sign in");
				return;
			}
			const finalized = await signIn.finalize();
			if (finalized.error) {
				toast.error(clerkError(finalized.error) ?? "Could not sign in");
				return;
			}
			if (onSuccess) {
				onSuccess();
			} else {
				router.push("/dashboard");
			}
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-5">
			<div className="flex flex-col gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<Button type="submit" disabled={submitting}>
				{submitting ? "Signing in…" : "Sign in"}
			</Button>
			<p className="text-center text-sm text-muted-foreground">
				No account?{" "}
				{onSwitchToSignUp ? (
					<button
						type="button"
						onClick={onSwitchToSignUp}
						className="font-medium text-foreground underline"
					>
						Sign up
					</button>
				) : (
					<Link
						href="/sign-up"
						className="font-medium text-foreground underline"
					>
						Sign up
					</Link>
				)}
			</p>
		</form>
	);
}

function clerkError(err: unknown): string | undefined {
	if (typeof err !== "object" || err === null) return undefined;
	if ("errors" in err && Array.isArray((err as { errors: unknown[] }).errors)) {
		const first = (err as { errors: { message?: string }[] }).errors[0];
		if (first?.message) return first.message;
	}
	if (
		"message" in err &&
		typeof (err as { message: unknown }).message === "string"
	) {
		return (err as { message: string }).message;
	}
	return undefined;
}
