"use client";

import { useUser } from "@clerk/nextjs";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { AreaMultiSelect } from "@/components/areas/area-multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import type { InvestmentRange, UserRole } from "@/generated/prisma/enums";
import { useTranslation } from "@/hooks/use-translation";
import {
	COUNTRIES,
	COUNTRY_LABEL_KEYS,
	INVESTMENT_RANGE_LABELS,
	INVESTMENT_RANGES,
	ROLE_LABEL_KEYS,
} from "@/lib/constants";
import { updateProfile } from "./actions";

type ProfileInitial = {
	name: string;
	email: string;
	country: string;
	role: UserRole;
	investmentCapacity: InvestmentRange | null;
	areaIds: string[];
	referralCode: string;
};

export function ProfileForm({
	initial,
	areas,
}: {
	initial: ProfileInitial;
	areas: { id: string; name: string }[];
}) {
	const t = useTranslation();
	const { user } = useUser();
	const [name, setName] = useState(initial.name);
	const [country, setCountry] = useState(initial.country);
	const [capacity, setCapacity] = useState<InvestmentRange | "">(
		initial.investmentCapacity ?? "",
	);
	const [areaIds, setAreaIds] = useState<string[]>(initial.areaIds);
	const [isPending, startTransition] = useTransition();
	const [origin, setOrigin] = useState("");

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	const isInvestor = initial.role === "INVESTOR";
	const referralUrl = `${origin}/r/${initial.referralCode}`;

	function copyReferralLink() {
		void navigator.clipboard.writeText(referralUrl);
		toast.success(t("profReferralLinkCopied"));
	}

	function shareReferralLink() {
		if (navigator.share) {
			navigator.share({ url: referralUrl }).catch(() => {});
		} else {
			copyReferralLink();
		}
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		startTransition(async () => {
			const result = await updateProfile({
				name,
				country,
				investmentCapacity: isInvestor && capacity ? capacity : null,
				areaIds: isInvestor ? areaIds : [],
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

					<div className="flex flex-col gap-2">
						<Label htmlFor="areas">{t("profSectorsOfInterest")}</Label>
						<AreaMultiSelect
							id="areas"
							areas={areas}
							value={areaIds}
							onChange={setAreaIds}
							placeholder={t("profSearchAreas")}
							emptyLabel={t("projNoSectorFound")}
						/>
					</div>
				</>
			)}

			<div className="flex flex-col gap-4 border-t pt-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0 break-words text-sm text-muted-foreground">
						{t("profReferralCode")}{" "}
						<span className="font-mono font-medium text-foreground">
							{initial.referralCode}
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={copyReferralLink}
						>
							{t("profReferralCopyLink")}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={shareReferralLink}
						>
							{t("profReferralShare")}
						</Button>
						<Dialog>
							<DialogTrigger
								render={<Button type="button" variant="outline" size="sm" />}
							>
								{t("profReferralQr")}
							</DialogTrigger>
							<DialogContent className="sm:max-w-sm">
								<DialogHeader>
									<DialogTitle>{initial.referralCode}</DialogTitle>
									<DialogDescription>
										{t("profReferralQrHint")}
									</DialogDescription>
								</DialogHeader>
								<div className="mx-auto rounded-lg bg-white p-4">
									<QRCodeSVG value={referralUrl} size={224} />
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>
				<Button
					type="submit"
					size="lg"
					disabled={isPending}
					className="w-full sm:w-auto sm:self-end"
				>
					{isPending ? t("commonSaving") : t("profSaveChanges")}
				</Button>
			</div>
		</form>
	);
}
