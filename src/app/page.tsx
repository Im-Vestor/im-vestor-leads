"use client";

import {
	ArrowRight,
	ArrowUpRight,
	Briefcase,
	Compass,
	Handshake,
	ShieldCheck,
	Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect } from "react";

import BlurText from "@/components/BlurText";
import GradientText from "@/components/GradientText";
import ShinyText from "@/components/ShinyText";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

function LinkedinIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
		</svg>
	);
}

function InstagramIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.95c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.41-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.17.42-.36 1.04-.41 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.41 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.17 1.04.36 2.19.41 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.41.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.17-.42.36-1.04.41-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.41-2.19a3.63 3.63 0 0 0-.88-1.35 3.63 3.63 0 0 0-1.35-.88c-.42-.17-1.04-.36-2.19-.41-1.24-.06-1.61-.07-4.76-.07zm0 3.32a4.57 4.57 0 1 0 0 9.14 4.57 4.57 0 0 0 0-9.14zm0 7.54a2.97 2.97 0 1 1 0-5.94 2.97 2.97 0 0 1 0 5.94zm5.82-7.74a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0z" />
		</svg>
	);
}

const StarField = dynamic(() => import("@/components/ui/StarField"), {
	ssr: false,
	loading: () => (
		<div className="relative w-full overflow-hidden bg-black min-h-[400px]" />
	),
});

const Particles = dynamic(() => import("@/components/Particles"), {
	ssr: false,
});

const GOLD_BUTTON =
	"bg-gradient-to-r from-[#EDD689] to-[#D3B662] text-black hover:opacity-90";

export default function Home() {
	const { theme, setTheme } = useTheme();
	const t = useTranslation();

	// biome-ignore lint/correctness/useExhaustiveDependencies: force dark theme on mount only, restore on unmount
	useEffect(() => {
		const previousTheme = theme;
		if (theme !== "dark") {
			setTheme("dark");
		}
		return () => {
			if (previousTheme && previousTheme !== "dark") {
				setTheme(previousTheme);
			}
		};
	}, []);

	return (
		<div className="-mt-12 w-full overflow-hidden text-white">
			<main className="min-h-screen pt-16">
				<div className="flex w-full flex-col items-center text-center">
					<div className="relative flex w-full flex-col items-center text-center">
						<div className="absolute inset-0 -bottom-16">
							<Particles
								className="h-full w-full"
								particleColors={["#EDD689", "#E5CD82", "#ffffff"]}
								particleCount={220}
								particleSpread={10}
								speed={0.08}
								particleBaseSize={90}
								moveParticlesOnHover
								alphaParticles
								disableRotation
							/>
						</div>
						<div className="pointer-events-none relative z-10 flex flex-col items-center text-center">
							<div className="relative">
								<Image
									src="/logo/imvestor.png"
									alt="Im-Vestor Leads"
									width={64}
									height={64}
								/>
							</div>
							<span className="mt-2 text-2xl font-medium">Im-Vestor Leads</span>
							<h1 className="mt-8 md:mt-16 px-4">
								<BlurText
									text={t("weMeanBusiness")}
									animateBy="words"
									direction="top"
									delay={120}
									className="justify-center font-['Segoe UI'] text-3xl sm:text-5xl md:text-6xl lg:text-[84px] leading-[120%] [&>span]:bg-gradient-to-b [&>span]:from-white [&>span]:to-white/50 [&>span]:bg-clip-text [&>span]:text-transparent"
								/>
							</h1>
							<span className="mt-4 md:mt-6 w-full md:w-2/3 px-4 font-['Segoe UI'] text-base md:text-xl leading-[140%] font-light">
								<ShinyText
									text={t("connectingEntrepreneursAndInvestors")}
									color="#8a8a99"
									shineColor="#EDD689"
									speed={3}
								/>
							</span>
							<div className="pointer-events-auto">
								<Button
									render={<Link href="/sign-up" />}
									className={`mt-8 md:mt-16 rounded-full transition-all duration-500 hover:scale-x-105 hover:opacity-75 ${GOLD_BUTTON}`}
								>
									{t("getStarted")} <ArrowUpRight />
								</Button>
							</div>
						</div>
					</div>

					<div className="mt-16 md:mt-32 py-12 md:py-24 w-full px-4 bg-gradient-to-b from-[#030014] to-black">
						<h2 className="px-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-6xl lg:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
							{t("whyChooseImVestor")}
						</h2>
						<GradientText
							colors={["#EDD689", "#D3B662", "#8A6E2F", "#EDD689"]}
							animationSpeed={5}
							className="mb-8 md:mb-12 px-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-6xl lg:text-[84px] leading-[120%]"
						>
							Im-Vestor Leads
						</GradientText>

						<div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 text-center md:grid-cols-3 md:grid-rows-3 md:text-start relative opacity-70">
							<div className="absolute inset-0 z-10 pointer-events-none">
								<div className="absolute top-1/2 left-1/2 h-2/3 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl" />
								<div className="absolute inset-0 transform-gpu animate-breathe-slow will-change-transform">
									<Image
										src="/images/vector-bg-features.svg"
										alt="Im-Vestor Leads"
										fill
									/>
								</div>
							</div>
							<SpotlightCard
								spotlightColor="rgba(56, 189, 248, 0.2)"
								className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#38bdf8]/10 to-[#030014]/80 p-6 backdrop-blur-md md:col-span-2 group hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-[transform,box-shadow] duration-300"
							>
								<div className="flex flex-col items-center text-center relative z-10">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-[#38bdf8]/20 blur-md animate-breathe" />
										<Compass className="mx-auto h-12 w-12 text-[#38bdf8] relative z-10 md:mx-0" />
									</div>
									<h2 className="mt-4 text-2xl font-semibold text-[#38bdf8]">
										{t("featurePublishTitle")}
									</h2>
									<p className="mt-2 text-gray-300">
										{t("featurePublishDesc")}
									</p>
								</div>
							</SpotlightCard>

							<SpotlightCard
								spotlightColor="rgba(168, 85, 247, 0.2)"
								className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#a855f7]/10 to-[#030014]/80 p-6 backdrop-blur-md group hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-[transform,box-shadow] duration-300"
							>
								<div className="flex flex-col items-center text-center relative z-10">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-[#a855f7]/20 blur-md animate-breathe" />
										<Handshake className="mx-auto h-12 w-12 text-[#a855f7] relative z-10 md:mx-0" />
									</div>
									<h2 className="mt-4 text-2xl font-semibold text-[#a855f7]">
										{t("featureDiscoverTitle")}
									</h2>
									<p className="mt-2 text-gray-300">
										{t("featureDiscoverDesc")}
									</p>
								</div>
							</SpotlightCard>

							<SpotlightCard
								spotlightColor="rgba(34, 211, 238, 0.2)"
								className="row-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#22d3ee]/10 to-[#030014]/80 p-6 backdrop-blur-md md:row-span-2 group hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-[transform,box-shadow] duration-300"
							>
								<div className="flex h-full flex-col items-center justify-center text-center relative z-10">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-[#22d3ee]/20 blur-md animate-breathe" />
										<Briefcase className="mx-auto h-12 w-12 text-[#22d3ee] relative z-10 md:mx-0" />
									</div>
									<h2 className="mt-4 text-2xl font-semibold text-[#22d3ee]">
										{t("featureConnectTitle")}
									</h2>
									<p className="mt-2 text-gray-300">
										{t("featureConnectDesc")}
									</p>
								</div>
							</SpotlightCard>

							<div className="hidden flex-col items-center justify-center md:flex">
								<Image
									src={"/images/home-diamond.svg"}
									alt="Im-Vestor Leads"
									width={180}
									height={180}
								/>
							</div>

							<SpotlightCard
								spotlightColor="rgba(250, 204, 21, 0.2)"
								className="rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#facc15]/10 to-[#030014]/80 p-6 backdrop-blur-md group hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-[transform,box-shadow] duration-300"
							>
								<div className="flex flex-col items-center text-center relative z-10">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-[#facc15]/20 blur-md animate-breathe" />
										<Zap className="mx-auto h-12 w-12 text-[#facc15] relative z-10 md:mx-0" />
									</div>
									<h2 className="mt-4 text-2xl font-semibold text-[#facc15]">
										{t("featureUnlockTitle")}
									</h2>
									<p className="mt-2 text-gray-300">{t("featureUnlockDesc")}</p>
								</div>
							</SpotlightCard>

							<SpotlightCard
								spotlightColor="rgba(248, 113, 113, 0.2)"
								className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#f87171]/10 to-[#030014]/80 p-6 backdrop-blur-md md:col-span-2 group hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(248,113,113,0.3)] transition-[transform,box-shadow] duration-300"
							>
								<div className="flex flex-col items-center text-center relative z-10">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-[#f87171]/20 blur-md animate-breathe" />
										<ShieldCheck className="mx-auto h-12 w-12 text-[#f87171] relative z-10 md:mx-0" />
									</div>
									<h2 className="mt-4 text-2xl font-semibold text-[#f87171]">
										{t("featureSecureTitle")}
									</h2>
									<p className="mt-2 text-gray-300">{t("featureSecureDesc")}</p>
								</div>
							</SpotlightCard>
						</div>
					</div>

					<StarField>
						<div className="relative w-full overflow-hidden">
							<div className="relative z-10 mb-20 px-4">
								<h2 className="mb-8 md:mb-12 mx-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-6xl lg:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent md:mx-0">
									{t("businessRevolution")}
								</h2>
								<div className="p-6">
									<div className="mx-auto flex max-w-4xl flex-col justify-center gap-10 md:flex-row">
										<SpotlightCard
											spotlightColor="rgba(229, 205, 130, 0.18)"
											className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-[#030014]/20 bg-opacity-30 px-6 py-16 backdrop-blur-md group hover:scale-105 hover:shadow-[0_0_25px_rgba(229,205,130,0.3)] transition-[transform,box-shadow] duration-300"
										>
											<div className="relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
												<Image
													src={"/images/astronaut.png"}
													alt="Im-Vestor Leads"
													width={64}
													height={180}
												/>
											</div>
											<h2 className="mt-4 text-xl font-semibold bg-primary-gradient bg-clip-text text-transparent relative z-10">
												{t("entrepreneur")}
											</h2>
											<p className="mt-2 max-w-xs text-center text-gray-300 relative z-10">
												{t("entrepreneurDesc")}
											</p>

											<Button
												render={<Link href="/sign-up" />}
												className={`mt-8 z-50 ${GOLD_BUTTON}`}
											>
												{t("joinAs")} {t("entrepreneur")}
												<ArrowRight className="ml-2" />
											</Button>
										</SpotlightCard>
										<SpotlightCard
											spotlightColor="rgba(229, 205, 130, 0.18)"
											className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-[#030014]/20 bg-opacity-30 px-6 py-16 backdrop-blur-md group hover:scale-105 hover:shadow-[0_0_25px_rgba(229,205,130,0.3)] transition-[transform,box-shadow] duration-300"
										>
											<div className="relative z-10 mt-6 group-hover:-translate-y-2 transition-transform duration-300">
												<Image
													src={"/images/rocket.png"}
													alt="Im-Vestor Leads"
													width={82}
													height={180}
												/>
											</div>
											<h2 className="mt-4 text-xl font-semibold bg-primary-gradient bg-clip-text text-transparent relative z-10">
												{t("investor")}
											</h2>
											<p className="mt-2 max-w-xs text-center text-gray-300 relative z-10">
												{t("investorDesc")}
											</p>

											<Button
												render={<Link href="/sign-up" />}
												className={`mt-8 z-50 ${GOLD_BUTTON}`}
											>
												{t("joinAs")} {t("investor")}
												<ArrowRight className="ml-2" />
											</Button>
										</SpotlightCard>
									</div>
								</div>
							</div>
						</div>
					</StarField>

					<StarField>
						<footer className="mx-auto mb-16 mt-16 md:mt-32 w-full max-w-content px-6 md:px-12">
							<hr className="h-0.5 w-full bg-neutral-100 opacity-10" />
							<div className="my-8 flex w-full flex-col items-center gap-6 text-gray-500 md:flex-row">
								<p>{t("followUs")}</p>
								<Link
									href="https://www.linkedin.com/in/guilherme-beauvalet-3227b3291"
									className="hover:opacity-70"
								>
									<LinkedinIcon className="ml-2 h-6 w-6" />
								</Link>
								<Link
									href="https://www.instagram.com/im_vestor/"
									className="hover:opacity-70"
								>
									<InstagramIcon className="h-6 w-6" />
								</Link>
								<p>@Im-Vestor</p>
								<Link
									href={"mailto:help@im-vestor.com"}
									className="hover:opacity-70"
								>
									<p>help@im-vestor.com</p>
								</Link>
							</div>
							<hr className="h-0.5 w-full bg-neutral-100 opacity-10" />
							<div className="my-8 flex w-full flex-col items-center gap-6 text-gray-500 md:flex-row">
								<Link href="/terms" className="hover:opacity-70">
									<p>{t("termsAndConditions")}</p>
								</Link>
								<p>{t("copyright")}</p>
							</div>
							<p className="mt-4 text-center text-xs text-gray-700">
								{t("legalDisclaimer")}
							</p>
						</footer>
					</StarField>
				</div>
			</main>
		</div>
	);
}
