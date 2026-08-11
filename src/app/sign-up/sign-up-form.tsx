"use client";

import { useClerk, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AreaMultiSelect } from "@/components/areas/area-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InvestmentRange } from "@/generated/prisma/enums";
import { useTranslation } from "@/hooks/use-translation";
import {
	COUNTRIES,
	COUNTRY_LABEL_KEYS,
	INVESTMENT_RANGE_LABELS,
	INVESTMENT_RANGES,
	ROLE_LABEL_KEYS,
	SIGNUP_ROLES,
} from "@/lib/constants";
import { completeSignup } from "./actions";

type SignUpFormProps = {
	areas: { id: string; name: string }[];
	onSuccess?: () => void;
	onSwitchToSignIn?: () => void;
	initialRef?: string;
};

export function SignUpForm({
	areas,
	onSuccess,
	onSwitchToSignIn,
	initialRef,
}: SignUpFormProps) {
	const t = useTranslation();
	const { signUp } = useSignUp();
	const clerk = useClerk();
	const router = useRouter();

	const [submitting, setSubmitting] = useState(false);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [country, setCountry] = useState("");
	const [role, setRole] = useState<"ENTREPRENEUR" | "INVESTOR">("ENTREPRENEUR");
	const [referredByCode, setReferredByCode] = useState(initialRef ?? "");
	const [capacity, setCapacity] = useState<InvestmentRange | "">("");
	const [areaIds, setAreaIds] = useState<string[]>([]);

	const isInvestor = role === "INVESTOR";

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			const created = await signUp.password({ emailAddress: email, password });
			if (created.error) {
				toast.error(clerkError(created.error) ?? t("authCouldNotSignUp"));
				return;
			}
			if (signUp.status !== "complete") {
				toast.error(t("authCouldNotCompleteSignUp"));
				return;
			}
			const finalized = await signUp.finalize();
			if (finalized.error) {
				toast.error(
					clerkError(finalized.error) ?? t("authCouldNotFinishSignUp"),
				);
				return;
			}
			await signUp.reset();

			const result = await completeSignup({
				email,
				name,
				country,
				role,
				referredByCode,
				investmentCapacity: isInvestor && capacity ? capacity : null,
				areaIds: isInvestor ? areaIds : [],
			});
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			await clerk.user?.reload();
			toast.success(t("authWelcomeToImVestor"));
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
					autoComplete="new-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="name">{t("authName")}</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("authYourFullName")}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="country">{t("authCountry")}</Label>
				<NativeSelect
					id="country"
					className="w-full"
					value={country}
					onChange={(e) => setCountry(e.target.value)}
				>
					<NativeSelectOption value="">
						{t("authSelectCountry")}
					</NativeSelectOption>
					{COUNTRIES.map((c) => (
						<NativeSelectOption key={c} value={c}>
							{t(COUNTRY_LABEL_KEYS[c])}
						</NativeSelectOption>
					))}
				</NativeSelect>
			</div>

			<div className="flex flex-col gap-2">
				<Label>{t("authIAmA")}</Label>
				<Tabs
					value={role}
					onValueChange={(value) =>
						setRole(value as "ENTREPRENEUR" | "INVESTOR")
					}
				>
					<TabsList className="h-10 w-full">
						{SIGNUP_ROLES.map((r) => (
							<TabsTrigger key={r} value={r} className="text-sm">
								{t(ROLE_LABEL_KEYS[r])}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			{isInvestor && (
				<>
					<div className="flex flex-col gap-2">
						<Label htmlFor="capacity">{t("authInvestmentCapacity")}</Label>
						<NativeSelect
							id="capacity"
							className="w-full"
							value={capacity}
							onChange={(e) =>
								setCapacity(e.target.value as InvestmentRange | "")
							}
						>
							<NativeSelectOption value="">
								{t("authSelectRange")}
							</NativeSelectOption>
							{INVESTMENT_RANGES.map((r) => (
								<NativeSelectOption key={r} value={r}>
									{INVESTMENT_RANGE_LABELS[r]}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="areas">{t("authSectorsOfInterest")}</Label>
						<AreaMultiSelect
							id="areas"
							areas={areas}
							value={areaIds}
							onChange={setAreaIds}
							placeholder={t("authSearchAreas")}
							emptyLabel={t("projNoSectorFound")}
						/>
					</div>
				</>
			)}

			<div className="flex flex-col gap-2">
				<Label htmlFor="ref">
					{t("authReferralCode")} ({t("commonOptional")})
				</Label>
				<Input
					id="ref"
					value={referredByCode}
					onChange={(e) => setReferredByCode(e.target.value)}
					placeholder={t("authReferralExample")}
				/>
			</div>

			<div id="clerk-captcha" />

			<Button type="submit" size="lg" className="w-full" disabled={submitting}>
				{submitting ? t("authCreating") : t("authContinue")}
			</Button>

			<p className="text-center text-sm text-muted-foreground">
				{t("authAlreadyHaveAccount")}{" "}
				{onSwitchToSignIn ? (
					<button
						type="button"
						onClick={onSwitchToSignIn}
						className="font-medium text-foreground underline"
					>
						{t("authSignIn")}
					</button>
				) : (
					<Link
						href="/sign-in"
						className="font-medium text-foreground underline"
					>
						{t("authSignIn")}
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
