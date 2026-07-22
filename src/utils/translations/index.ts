import type { Language } from "./config";

import deDE from "./de-DE.json";
import enUS from "./en-US.json";
import esES from "./es-ES.json";
import frFR from "./fr-FR.json";
import itIT from "./it-IT.json";
import ptPT from "./pt-PT.json";

export type TranslationKey = keyof typeof enUS;

const translations: Record<Language, Record<TranslationKey, string>> = {
	"en-US": enUS,
	"pt-PT": ptPT,
	"es-ES": esES,
	"fr-FR": frFR,
	"it-IT": itIT,
	"de-DE": deDE,
};

export const getTranslation = (
	language: Language,
	key: TranslationKey,
): string => {
	return translations[language]?.[key] ?? enUS[key];
};
