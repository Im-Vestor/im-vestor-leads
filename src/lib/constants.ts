import { InvestmentRange, Sector, UserRole } from "@/generated/prisma/enums";
import type { TranslationKey } from "@/utils/translations";

export const ROLE_LABEL_KEYS: Record<UserRole, TranslationKey> = {
	[UserRole.ENTREPRENEUR]: "roleEntrepreneur",
	[UserRole.INVESTOR]: "roleInvestor",
	[UserRole.ADMIN]: "roleAdmin",
};

export const SIGNUP_ROLES: UserRole[] = [
	UserRole.ENTREPRENEUR,
	UserRole.INVESTOR,
];

export const SECTOR_LABEL_KEYS: Record<Sector, TranslationKey> = {
	[Sector.TECHNOLOGY]: "sectorTechnology",
	[Sector.HEALTHCARE]: "sectorHealthcare",
	[Sector.FINTECH]: "sectorFintech",
	[Sector.EDTECH]: "sectorEdtech",
	[Sector.CLEANTECH]: "sectorCleantech",
	[Sector.ECOMMERCE]: "sectorEcommerce",
	[Sector.SAAS]: "sectorSaas",
	[Sector.AGRITECH]: "sectorAgritech",
	[Sector.PROPTECH]: "sectorProptech",
	[Sector.BIOTECH]: "sectorBiotech",
};

export const INVESTMENT_RANGE_LABELS: Record<InvestmentRange, string> = {
	[InvestmentRange.R_10K_50K]: "€10K–€50K",
	[InvestmentRange.R_50K_200K]: "€50K–€200K",
	[InvestmentRange.R_200K_500K]: "€200K–€500K",
	[InvestmentRange.R_500K_1M]: "€500K–€1M",
	[InvestmentRange.R_1M_5M]: "€1M–€5M",
	[InvestmentRange.R_5M_PLUS]: "€5M+",
};

export const ROLES = Object.values(UserRole);
export const SECTORS = Object.values(Sector);
export const INVESTMENT_RANGES = Object.values(InvestmentRange);

export const COUNTRIES = [
	"Portugal",
	"Spain",
	"France",
	"Germany",
	"UK",
	"Italy",
	"Netherlands",
	"USA",
	"Brazil",
] as const;

export const COUNTRY_LABEL_KEYS: Record<string, TranslationKey> = {
	Portugal: "countryPortugal",
	Spain: "countrySpain",
	France: "countryFrance",
	Germany: "countryGermany",
	UK: "countryUk",
	Italy: "countryItaly",
	Netherlands: "countryNetherlands",
	USA: "countryUsa",
	Brazil: "countryBrazil",
};
