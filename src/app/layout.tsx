import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "IM-VESTOR — Leads Marketplace",
	description:
		"Marketplace connecting entrepreneurs and investors. Browse leads, send pokes, chat in real time.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(
				"dark",
				"h-full",
				"antialiased",
				geistMono.variable,
				"font-sans",
				dmSans.variable,
			)}
		>
			<body className="min-h-full flex flex-col">
				<ClerkProvider>
					<LanguageProvider>
						<div className="px-4 pt-4 md:px-6 lg:px-8">
							<Header />
						</div>
						{children}
						<Toaster />
					</LanguageProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
