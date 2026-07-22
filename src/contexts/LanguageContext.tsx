"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	DEFAULT_LANGUAGE,
	LANGUAGE_COOKIE,
	LANGUAGES,
	type Language,
} from "@/utils/translations/config";

export {
	DEFAULT_LANGUAGE,
	isLanguage,
	LANGUAGE_COOKIE,
	LANGUAGES,
	type Language,
} from "@/utils/translations/config";

type LanguageContextType = {
	language: Language;
	setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextType>({
	language: DEFAULT_LANGUAGE,
	setLanguage: (_: Language) => {},
});

export const useLanguage = () => useContext(LanguageContext);

type LanguageProviderProps = {
	children: ReactNode;
	initialLanguage?: Language;
};

export const LanguageProvider = ({
	children,
	initialLanguage = DEFAULT_LANGUAGE,
}: LanguageProviderProps) => {
	const [language, setLanguage] = useState<Language>(initialLanguage);

	useEffect(() => {
		document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000; samesite=lax`;
		localStorage.setItem(LANGUAGE_COOKIE, language);
		document.documentElement.lang = language.split("-")[0];
	}, [language]);

	return (
		<LanguageContext.Provider value={{ language, setLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
};
