"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import type {
	InvestmentRange,
	Sector,
	UserRole,
} from "@/generated/prisma/enums";
import { useTranslation } from "@/hooks/use-translation";
import {
	COUNTRIES,
	COUNTRY_LABEL_KEYS,
	INVESTMENT_RANGE_LABELS,
	INVESTMENT_RANGES,
	ROLE_LABEL_KEYS,
	SECTOR_LABEL_KEYS,
	SECTORS,
} from "@/lib/constants";
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
	const t = useTranslation();
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
				toast.success(t("profProfileSaved"));
			} else toast.error(result.error);
		});
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Label htmlFor="email">{t("profEmail")}</Label>
				<Input id="email" value={initial.email} disabled readOnly />
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="name">{t("profName")}</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("profNamePlaceholder")}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="country">{t("profCountry")}</Label>
				<NativeSelect
					id="country"
					className="w-full"
					value={country}
					onChange={(e) => setCountry(e.target.value)}
				>
					<NativeSelectOption value="">
						{t("profSelectCountry")}
					</NativeSelectOption>
					{COUNTRIES.map((c) => (
						<NativeSelectOption key={c} value={c}>
							{t(COUNTRY_LABEL_KEYS[c])}
						</NativeSelectOption>
					))}
				</NativeSelect>
			</div>

			<div className="flex flex-col gap-2">
				<Label>{t("profAccountType")}</Label>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{t(ROLE_LABEL_KEYS[initial.role])}</Badge>
					<span className="text-sm text-muted-foreground">
						{t("profAccountTypeHint")}
					</span>
				</div>
			</div>

			{isInvestor && (
				<>
					<div className="flex flex-col gap-2">
						<Label htmlFor="capacity">{t("profInvestmentCapacity")}</Label>
						<NativeSelect
							id="capacity"
							className="w-full"
							value={capacity}
							onChange={(e) =>
								setCapacity(e.target.value as InvestmentRange | "")
							}
						>
							<NativeSelectOption value="">
								{t("profSelectRange")}
							</NativeSelectOption>
							{INVESTMENT_RANGES.map((r) => (
								<NativeSelectOption key={r} value={r}>
									{INVESTMENT_RANGE_LABELS[r]}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>

					<fieldset className="flex flex-col gap-3">
						<legend className="mb-1 text-sm font-medium">
							{t("profSectorsOfInterest")}
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
									{t(SECTOR_LABEL_KEYS[s])}
								</label>
							))}
						</div>
					</fieldset>
				</>
			)}

			<div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0 break-words text-sm text-muted-foreground">
					{t("profReferralCode")}{" "}
					<span className="font-mono font-medium text-foreground">
						{initial.referralCode}
					</span>
				</div>
				<Button
					type="submit"
					size="lg"
					disabled={isPending}
					className="w-full sm:w-auto"
				>
					{isPending ? t("commonSaving") : t("profSaveChanges")}
				</Button>
			</div>
		</form>
	);
}
