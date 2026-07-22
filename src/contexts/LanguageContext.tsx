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

// Re-export the neutral config so existing imports from this module keep working.
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
	setLanguage: (_: Language) => {
		// Overridden by the provider
	},
});

export const useLanguage = () => useContext(LanguageContext);

type LanguageProviderProps = {
	children: ReactNode;
	// Seeded server-side from the language cookie so the first paint is already
	// in the right language (no flash, no hydration mismatch).
	initialLanguage?: Language;
};

export const LanguageProvider = ({
	children,
	initialLanguage = DEFAULT_LANGUAGE,
}: LanguageProviderProps) => {
	const [language, setLanguage] = useState<Language>(initialLanguage);

	useEffect(() => {
		// Persist as a cookie so Server Components and the <html lang> attribute
		// can read the same value; mirror to localStorage for good measure.
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
