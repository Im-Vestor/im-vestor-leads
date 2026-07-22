import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/utils/translations";

export const useTranslation = () => {
	const { language } = useLanguage();

	return useCallback(
		(key: Parameters<typeof getTranslation>[1]) => {
			return getTranslation(language, key);
		},
		[language],
	);
};
