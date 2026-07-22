"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";

type SignInFormProps = {
	onSuccess?: () => void;
	onSwitchToSignUp?: () => void;
};

export function SignInForm({
	onSuccess,
	onSwitchToSignUp,
}: SignInFormProps = {}) {
	const t = useTranslation();
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
				toast.error(clerkError(attempt.error) ?? t("authCouldNotSignIn"));
				return;
			}
			if (signIn.status !== "complete") {
				toast.error(t("authAdditionalVerification"));
				return;
			}
			const finalized = await signIn.finalize();
			if (finalized.error) {
				toast.error(clerkError(finalized.error) ?? t("authCouldNotSignIn"));
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
				<Label htmlFor="email">{t("authEmail")}</Label>
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
				<Label htmlFor="password">{t("authPassword")}</Label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<Button type="submit" size="lg" className="w-full" disabled={submitting}>
				{submitting ? t("authSigningIn") : t("authSignIn")}
			</Button>
			<p className="text-center text-sm text-muted-foreground">
				{t("authNoAccount")}{" "}
				{onSwitchToSignUp ? (
					<button
						type="button"
						onClick={onSwitchToSignUp}
						className="font-medium text-foreground underline"
					>
						{t("authSignUp")}
					</button>
				) : (
					<Link
						href="/sign-up"
						className="font-medium text-foreground underline"
					>
						{t("authSignUp")}
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
