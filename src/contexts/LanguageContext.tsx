"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

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

type LanguageContextType = {
	language: Language;
	setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextType>({
	language: "en-US",
	setLanguage: (_: Language) => {
		// Overridden by the provider
	},
});

export const useLanguage = () => useContext(LanguageContext);

type LanguageProviderProps = {
	children: ReactNode;
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
	const [language, setLanguage] = useState<Language>("en-US");

	useEffect(() => {
		const savedLanguage = localStorage.getItem("language") as Language;
		if (savedLanguage && LANGUAGES.some((l) => l.code === savedLanguage)) {
			setLanguage(savedLanguage);
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("language", language);
	}, [language]);

	return (
		<LanguageContext.Provider value={{ language, setLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
};
