"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
	BellIcon,
	ChevronDownIcon,
	GlobeIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	type LucideIcon,
	MessageSquareIcon,
	RocketIcon,
	SearchIcon,
	ShoppingBagIcon,
	UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyUserId } from "@/app/messages/notifications.actions";
import SpotlightCard from "@/components/SpotlightCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
	LANGUAGES,
	type Language,
	useLanguage,
} from "@/contexts/LanguageContext";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
	{ label: "Explore", icon: SearchIcon },
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/projects", label: "Projects", icon: RocketIcon },
	{ label: "Inbox", icon: BellIcon },
	{ href: "/messages", label: "Chats", icon: MessageSquareIcon },
	{ href: "/shop", label: "Shop", icon: ShoppingBagIcon },
] satisfies { href?: string; label: string; icon: LucideIcon }[];

export const Header = () => {
	const { isSignedIn, isLoaded } = useUser();

	return (
		<header className="mx-auto mb-12 w-full max-w-content">
			<SpotlightCard
				spotlightColor="rgba(237, 214, 137, 0.1)"
				className="rounded-2xl border border-white/10 bg-[#030014]/60 backdrop-blur-md"
			>
				<div className="flex items-center justify-between gap-4 px-3 py-2.5 md:px-5">
					<Link
						href="/"
						aria-label="Im-Vestor"
						className="group flex shrink-0 items-center gap-2.5"
					>
						<Image
							src="/logo/imvestor.png"
							alt=""
							width={28}
							height={28}
							className="transition-[transform,filter] duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(237,214,137,0.6)]"
						/>
						<span className="hidden select-none items-baseline gap-1 font-semibold text-sm tracking-wide sm:flex">
							<span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
								Im-Vestor
							</span>
							<span className="bg-gradient-to-r from-gold to-gold-deep bg-clip-text text-transparent">
								Leads
							</span>
						</span>
					</Link>

					{isLoaded && isSignedIn && <NavLinks />}

					{isLoaded && (isSignedIn ? <UserMenu /> : <AuthActions />)}
				</div>
			</SpotlightCard>
		</header>
	);
};

const NavLinks = () => {
	const pathname = usePathname();
	const [userId, setUserId] = useState<string | null>(null);
	const { count, setCount, refresh } = useUnreadCount(userId);

	useEffect(() => {
		void getMyUserId().then((r) => {
			if (r.ok) setUserId(r.data);
		});
	}, []);

	useEffect(() => {
		if (pathname?.startsWith("/messages")) {
			setCount(0);
			void refresh();
		}
	}, [pathname, setCount, refresh]);

	return (
		<nav className="hidden items-center gap-1 md:flex">
			{NAV_LINKS.map(({ href, label, icon: Icon }) => {
				const showBadge = href === "/messages" && count > 0;
				const isActive = href ? pathname === href : false;
				return (
					<Button
						key={label}
						variant="ghost"
						size="sm"
						className={cn(
							"relative",
							isActive &&
								"text-gold after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-gold/70 after:to-transparent hover:text-gold",
						)}
						{...(href ? { render: <Link href={href} /> } : {})}
					>
						<Icon className="size-4" />
						{label}
						{showBadge ? (
							<Badge className="ml-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
								{count > 99 ? "99+" : count}
							</Badge>
						) : null}
					</Button>
				);
			})}
		</nav>
	);
};

const GoldRingAvatar = ({
	src,
	initials,
	className,
}: {
	src?: string;
	initials: string;
	className?: string;
}) => (
	<span className="shrink-0 rounded-full bg-gradient-to-br from-gold to-gold-deep p-px">
		<Avatar className={cn("border-2 border-[#0b0820]", className)}>
			<AvatarImage src={src} alt="" />
			<AvatarFallback className="bg-gradient-to-br from-gold to-gold-deep font-semibold text-[10px] text-black">
				{initials}
			</AvatarFallback>
		</Avatar>
	</span>
);

const UserMenu = () => {
	const { user } = useUser();
	const { signOut } = useClerk();

	const email = user?.primaryEmailAddress?.emailAddress;
	const displayName =
		user?.fullName || user?.firstName || email?.split("@")[0] || "Account";
	const initials = displayName
		.split(/\s+/)
		.map((word) => word[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						className="group h-auto gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-2.5 pl-1 transition-all hover:border-gold/40 hover:bg-white/10 hover:shadow-[0_0_16px_rgba(237,214,137,0.2)]"
					/>
				}
			>
				<GoldRingAvatar
					src={user?.imageUrl}
					initials={initials}
					className="size-7"
				/>
				<span className="hidden max-w-32 truncate font-medium text-sm sm:inline">
					{displayName}
				</span>
				<ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180" />
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="min-w-56">
				<div className="flex items-center gap-2.5 px-2 py-2">
					<GoldRingAvatar
						src={user?.imageUrl}
						initials={initials}
						className="size-9"
					/>
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">{displayName}</p>
						{email && (
							<p className="truncate text-muted-foreground text-xs">{email}</p>
						)}
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem render={<Link href="/profile" />}>
					<UserIcon className="size-4" />
					Profile
				</DropdownMenuItem>
				<LanguageMenu />
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => signOut({ redirectUrl: "/" })}
				>
					<LogOutIcon className="size-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const LanguageMenu = () => {
	const { language, setLanguage } = useLanguage();

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<GlobeIcon className="size-4" />
				Language
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuRadioGroup
					value={language}
					onValueChange={(value) => setLanguage(value as Language)}
				>
					{LANGUAGES.map(({ code, name, flag }) => (
						<DropdownMenuRadioItem key={code} value={code} className="gap-2">
							<Image
								src={`https://flagcdn.com/h60/${flag}.png`}
								alt=""
								width={16}
								height={12}
								className="rounded-[2px]"
							/>
							{name}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

const AuthActions = () => (
	<div className="flex items-center gap-2">
		<LanguageSwitcher />
		<Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
			Sign in
		</Button>
		<Button
			size="sm"
			className="rounded-full bg-gradient-to-r from-gold to-gold-deep text-black hover:opacity-90"
			render={<Link href="/sign-up" />}
		>
			Sign up
		</Button>
	</div>
);
