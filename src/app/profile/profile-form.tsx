"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type {
	InvestmentRange,
	Sector,
	UserRole,
} from "@/generated/prisma/enums";
import {
	COUNTRIES,
	INVESTMENT_RANGES,
	INVESTMENT_RANGE_LABELS,
	ROLE_LABELS,
	SECTORS,
	SECTOR_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { updateProfile } from "./actions";

type ProfileInitial = {
	name: string;
	email: string;
	country: string;
	role: UserRole;
	investmentCapacity: InvestmentRange | null;
	sectors: Sector[];
	referralCode: string;
};

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
	const { user } = useUser();
	const [name, setName] = useState(initial.name);
	const [country, setCountry] = useState(initial.country);
	const [capacity, setCapacity] = useState<InvestmentRange | "">(
		initial.investmentCapacity ?? "",
	);
	const [sectors, setSectors] = useState<Sector[]>(initial.sectors);
	const [isPending, startTransition] = useTransition();

	const isInvestor = initial.role === "INVESTOR";

	function toggleSector(sector: Sector, checked: boolean) {
		setSectors((prev) =>
			checked ? [...prev, sector] : prev.filter((s) => s !== sector),
		);
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		startTransition(async () => {
			const result = await updateProfile({
				name,
				country,
				investmentCapacity: isInvestor && capacity ? capacity : null,
				sectors: isInvestor ? sectors : [],
			});
			if (result.ok) {
				await user?.reload();
				toast.success("Profile saved");
			} else toast.error(result.error);
		});
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Label htmlFor="email">Email</Label>
				<Input id="email" value={initial.email} disabled readOnly />
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
				<Label>Account type</Label>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{ROLE_LABELS[initial.role]}</Badge>
					<span className="text-sm text-muted-foreground">
						Set at sign-up — can't be changed.
					</span>
				</div>
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
									className="flex items-center gap-2 text-sm"
									htmlFor={`sector-${s}`}
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

			<div className="flex items-center justify-between gap-4 border-t pt-4">
				<div className="text-sm text-muted-foreground">
					Referral code:{" "}
					<span className="font-mono font-medium text-foreground">
						{initial.referralCode}
					</span>
				</div>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Saving…" : "Save changes"}
				</Button>
			</div>
		</form>
	);
}
