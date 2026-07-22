import "server-only";

import { cookies } from "next/headers";
import {
	DEFAULT_LANGUAGE,
	isLanguage,
	type Language,
	LANGUAGE_COOKIE,
} from "./config";
import { getTranslation, type TranslationKey } from "./index";

// Reads the language cookie set by the client LanguageProvider. Server
// Components and layouts use this so their text matches the client's choice.
export const getLanguage = async (): Promise<Language> => {
	const value = (await cookies()).get(LANGUAGE_COOKIE)?.value;
	return isLanguage(value) ? value : DEFAULT_LANGUAGE;
};

// Returns a bound `t()` for use in Server Components: `const t = await getT()`.
export const getT = async (): Promise<(key: TranslationKey) => string> => {
	const language = await getLanguage();
	return (key: TranslationKey) => getTranslation(language, key);
};
