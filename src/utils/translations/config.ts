// Neutral i18n config shared by client (LanguageContext) and server (server.ts).
// No "use client" / "server-only" directive so it is safe to import from both.

export type Language =
	| "en-US"
	| "pt-PT"
	| "es-ES"
	| "fr-FR"
	| "it-IT"
	| "de-DE";

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
	{ code: "en-US", name: "English", flag: "us" },
	{ code: "pt-PT", name: "Português", flag: "pt" },
	{ code: "es-ES", name: "Español", flag: "es" },
	{ code: "fr-FR", name: "Français", flag: "fr" },
	{ code: "it-IT", name: "Italiano", flag: "it" },
	{ code: "de-DE", name: "Deutsch", flag: "de" },
];

export const DEFAULT_LANGUAGE: Language = "en-US";
export const LANGUAGE_COOKIE = "language";

export const isLanguage = (value: unknown): value is Language =>
	LANGUAGES.some((l) => l.code === value);
