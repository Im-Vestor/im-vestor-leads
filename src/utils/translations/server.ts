import "server-only";

import { cookies } from "next/headers";
import {
	DEFAULT_LANGUAGE,
	isLanguage,
	LANGUAGE_COOKIE,
	type Language,
} from "./config";
import { getTranslation, type TranslationKey } from "./index";

export const getLanguage = async (): Promise<Language> => {
	const value = (await cookies()).get(LANGUAGE_COOKIE)?.value;
	return isLanguage(value) ? value : DEFAULT_LANGUAGE;
};

export const getT = async (): Promise<(key: TranslationKey) => string> => {
	const language = await getLanguage();
	return (key: TranslationKey) => getTranslation(language, key);
};
