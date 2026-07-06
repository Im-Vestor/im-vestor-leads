"use client";

import { useClerk, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InvestmentRange, Sector } from "@/generated/prisma/enums";
import {
	COUNTRIES,
	INVESTMENT_RANGE_LABELS,
	INVESTMENT_RANGES,
	ROLE_LABELS,
	SECTOR_LABELS,
	SECTORS,
	SIGNUP_ROLES,
} from "@/lib/constants";
import { completeSignup } from "./actions";

type SignUpFormProps = {
	onSuccess?: () => void;
	onSwitchToSignIn?: () => void;
};

export function SignUpForm({
	onSuccess,
	onSwitchToSignIn,
}: SignUpFormProps = {}) {
	const { signUp } = useSignUp();
	const clerk = useClerk();
	const router = useRouter();

	const [submitting, setSubmitting] = useState(false);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [country, setCountry] = useState("");
	const [role, setRole] = useState<"ENTREPRENEUR" | "INVESTOR">("ENTREPRENEUR");
	const [referredByCode, setReferredByCode] = useState("");
	const [capacity, setCapacity] = useState<InvestmentRange | "">("");
	const [sectors, setSectors] = useState<Sector[]>([]);

	const isInvestor = role === "INVESTOR";

	function toggleSector(sector: Sector, checked: boolean) {
		setSectors((prev) =>
			checked ? [...prev, sector] : prev.filter((s) => s !== sector),
		);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			const created = await signUp.password({ emailAddress: email, password });
			if (created.error) {
				toast.error(clerkError(created.error) ?? "Could not sign up");
				return;
			}
			if (signUp.status !== "complete") {
				toast.error("Could not complete sign-up. Try again.");
				return;
			}
			const finalized = await signUp.finalize();
			if (finalized.error) {
				toast.error(clerkError(finalized.error) ?? "Could not finish sign-up");
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
				sectors: isInvestor ? sectors : [],
			});
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			await clerk.user?.reload();
			toast.success("Welcome to IM-VESTOR!");
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
					autoComplete="new-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Your full name"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="country">Country</Label>
				<NativeSelect
					id="country"
					className="w-full"
					value={country}
					onChange={(e) => setCountry(e.target.value)}
				>
					<NativeSelectOption value="">Select a country…</NativeSelectOption>
					{COUNTRIES.map((c) => (
						<NativeSelectOption key={c} value={c}>
							{c}
						</NativeSelectOption>
					))}
				</NativeSelect>
			</div>

			<div className="flex flex-col gap-2">
				<Label>I am a…</Label>
				<Tabs
					value={role}
					onValueChange={(value) =>
						setRole(value as "ENTREPRENEUR" | "INVESTOR")
					}
				>
					<TabsList className="h-10 w-full">
						{SIGNUP_ROLES.map((r) => (
							<TabsTrigger key={r} value={r} className="text-sm">
								{ROLE_LABELS[r]}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			{isInvestor && (
				<>
					<div className="flex flex-col gap-2">
						<Label htmlFor="capacity">Investment capacity</Label>
						<NativeSelect
							id="capacity"
							className="w-full"
							value={capacity}
							onChange={(e) =>
								setCapacity(e.target.value as InvestmentRange | "")
							}
						>
							<NativeSelectOption value="">Select a range…</NativeSelectOption>
							{INVESTMENT_RANGES.map((r) => (
								<NativeSelectOption key={r} value={r}>
									{INVESTMENT_RANGE_LABELS[r]}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>

					<fieldset className="flex flex-col gap-3">
						<legend className="mb-1 text-sm font-medium">
							Sectors of interest
						</legend>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{SECTORS.map((s) => (
								<label
									key={s}
									htmlFor={`sector-${s}`}
									className="flex items-center gap-2 text-sm"
								>
									<Checkbox
										id={`sector-${s}`}
										checked={sectors.includes(s)}
										onCheckedChange={(checked) =>
											toggleSector(s, checked === true)
										}
									/>
									{SECTOR_LABELS[s]}
								</label>
							))}
						</div>
					</fieldset>
				</>
			)}

			<div className="flex flex-col gap-2">
				<Label htmlFor="ref">Referral code (optional)</Label>
				<Input
					id="ref"
					value={referredByCode}
					onChange={(e) => setReferredByCode(e.target.value)}
					placeholder="e.g. JOAO-4F2K"
				/>
			</div>

			<div id="clerk-captcha" />

			<Button type="submit" disabled={submitting}>
				{submitting ? "Creating…" : "Continue"}
			</Button>

			<p className="text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				{onSwitchToSignIn ? (
					<button
						type="button"
						onClick={onSwitchToSignIn}
						className="font-medium text-foreground underline"
					>
						Sign in
					</button>
				) : (
					<Link
						href="/sign-in"
						className="font-medium text-foreground underline"
					>
						Sign in
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
