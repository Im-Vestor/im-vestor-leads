import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const HIGHLIGHTS = [
	"Publish projects to a curated marketplace",
	"Discover and filter qualified opportunities",
	"Unlock full access and negotiate directly",
];

export function AuthShell({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="-mt-12 w-full text-white">
			<div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center px-4 py-10">
				<div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:grid-cols-2">
					{/* Brand panel */}
					<div className="relative hidden flex-col justify-between gap-10 overflow-hidden border-white/10 border-r bg-gradient-to-br from-[#EDD689]/[0.08] to-transparent p-10 lg:flex">
						<div className="-top-32 -right-24 pointer-events-none absolute h-80 w-80 rounded-full bg-[#E5CD82]/15 blur-3xl" />

						<Link
							href="/"
							className="relative flex items-center gap-3 transition-transform hover:scale-105"
						>
							<Image
								src="/logo/imvestor.png"
								alt="Im-Vestor Leads"
								width={36}
								height={36}
							/>
							<span className="font-semibold text-xl">Im-Vestor Leads</span>
						</Link>

						<div className="relative">
							<h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text font-['Segoe_UI'] font-semibold text-4xl text-transparent leading-[115%]">
								Where deals
								<br />
								<span className="bg-primary-gradient bg-clip-text text-transparent">
									get done.
								</span>
							</h2>
							<ul className="mt-8 flex flex-col gap-3">
								{HIGHLIGHTS.map((item) => (
									<li
										key={item}
										className="flex items-start gap-3 text-sm text-white/70"
									>
										<Sparkles className="mt-0.5 size-4 shrink-0 text-[#EDD689]" />
										{item}
									</li>
								))}
							</ul>
						</div>

						<p className="relative text-white/30 text-xs">
							© 2026 Im-Vestor Leads
						</p>
					</div>

					{/* Form panel */}
					<div className="p-8 sm:p-10">
						<div className="mx-auto flex max-w-sm flex-col">
							<Link
								href="/"
								className="mb-8 flex items-center gap-2 lg:hidden"
								aria-label="Im-Vestor Leads"
							>
								<Image
									src="/logo/imvestor.png"
									alt="Im-Vestor Leads"
									width={28}
									height={28}
								/>
								<span className="font-semibold text-lg">Im-Vestor Leads</span>
							</Link>

							<h1 className="font-['Segoe_UI'] font-semibold text-3xl tracking-tight">
								{title}
							</h1>
							<p className="mt-2 text-sm text-white/60">{description}</p>

							<div className="mt-8">{children}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
