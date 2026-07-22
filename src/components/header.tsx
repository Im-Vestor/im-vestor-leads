"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
	BellIcon,
	ChevronDownIcon,
	GlobeIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	type LucideIcon,
	MenuIcon,
	MessageSquareIcon,
	RocketIcon,
	ShieldIcon,
	ShoppingBagIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyRole, getMyUserId } from "@/app/messages/notifications.actions";
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
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	LANGUAGES,
	type Language,
	useLanguage,
} from "@/contexts/LanguageContext";
import type { UserRole } from "@/generated/prisma/enums";
import { useTranslation } from "@/hooks/use-translation";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUnreadSupportCount } from "@/hooks/use-unread-support-count";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/utils/translations";

type NavLink = { href?: string; labelKey: TranslationKey; icon: LucideIcon };

const NAV_TAIL = [
	{ labelKey: "navInbox", icon: BellIcon },
	{ href: "/messages", labelKey: "navChats", icon: MessageSquareIcon },
	{ href: "/shop", labelKey: "navShop", icon: ShoppingBagIcon },
] satisfies NavLink[];

// Shared nav state. Called ONCE per signed-in header (opens a realtime unread
// subscription), then handed to both the desktop bar and the mobile drawer.
type NavData = {
	links: NavLink[];
	isAdmin: boolean;
	count: number;
	supportCount: number;
};

function useNavData(): NavData {
	const pathname = usePathname();
	const [userId, setUserId] = useState<string | null>(null);
	const [role, setRole] = useState<UserRole | null>(null);
	const isAdmin = role === "ADMIN";
	const { count, refresh } = useUnreadCount(userId);
	const { count: supportCount } = useUnreadSupportCount(isAdmin);

	useEffect(() => {
		void getMyUserId().then((r) => {
			if (r.ok) setUserId(r.data);
		});
		void getMyRole().then((r) => {
			if (r.ok) setRole(r.data);
		});
	}, []);

	useEffect(() => {
		if (pathname?.startsWith("/messages")) void refresh();
	}, [pathname, refresh]);

	// Entrepreneurs browse investors (person icon); investors browse projects
	// (rocket icon). Same /dashboard route, role-aware label and icon.
	const browseLabel: TranslationKey =
		role === "ENTREPRENEUR"
			? "navInvestors"
			: role === "INVESTOR"
				? "navProjects"
				: "navDashboard";
	const browseIcon =
		role === "ENTREPRENEUR"
			? UsersIcon
			: role === "INVESTOR"
				? RocketIcon
				: LayoutDashboardIcon;

	const links: NavLink[] = [
		{ href: "/dashboard", labelKey: browseLabel, icon: browseIcon },
		...(role === "ENTREPRENEUR" || role === "ADMIN"
			? [
					{
						href: "/projects",
						labelKey: "navProjects",
						icon: RocketIcon,
					} as NavLink,
				]
			: []),
		...NAV_TAIL,
	];

	return { links, isAdmin, count, supportCount };
}

export const Header = () => {
	const { isSignedIn, isLoaded } = useUser();

	return (
		<header className="mx-auto mb-8 w-full max-w-content md:mb-12">
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

					{isLoaded && (isSignedIn ? <SignedInNav /> : <AuthActions />)}
				</div>
			</SpotlightCard>
		</header>
	);
};

// Renders both presentations from a single data source: the horizontal bar
// (icons at tablet, labels at desktop) and the mobile hamburger drawer.
const SignedInNav = () => {
	const data = useNavData();
	return (
		<>
			<DesktopNav data={data} />
			<div className="flex items-center gap-2">
				<div className="hidden md:flex">
					<UserMenu />
				</div>
				<MobileNav data={data} />
			</div>
		</>
	);
};

const DesktopNav = ({ data }: { data: NavData }) => {
	const t = useTranslation();
	const pathname = usePathname();
	const { links, isAdmin, count, supportCount } = data;

	return (
		<nav className="hidden items-center gap-1 md:flex">
			{links.map(({ href, labelKey, icon: Icon }) => {
				const showBadge = href === "/messages" && count > 0;
				const isActive = href ? pathname === href : false;
				return (
					<Button
						key={labelKey}
						variant="ghost"
						size="sm"
						aria-label={t(labelKey)}
						className={cn(
							"relative",
							isActive &&
								"text-gold after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-gold/70 after:to-transparent hover:text-gold",
						)}
						{...(href ? { render: <Link href={href} /> } : {})}
					>
						<Icon className="size-4" />
						<span className="hidden lg:inline">{t(labelKey)}</span>
						{showBadge ? (
							<Badge className="ml-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
								{count > 99 ? "99+" : count}
							</Badge>
						) : null}
					</Button>
				);
			})}
			{isAdmin ? (
				<Button
					variant={pathname?.startsWith("/admin") ? "secondary" : "ghost"}
					size="sm"
					aria-label={t("navAdmin")}
					className="relative"
					render={<Link href="/admin" />}
				>
					<ShieldIcon className="size-4" />
					<span className="hidden lg:inline">{t("navAdmin")}</span>
					{supportCount > 0 ? (
						<Badge className="ml-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
							{supportCount > 99 ? "99+" : supportCount}
						</Badge>
					) : null}
				</Button>
			) : null}
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

function useDisplayIdentity() {
	const { user } = useUser();
	const email = user?.primaryEmailAddress?.emailAddress;
	const displayName =
		user?.fullName || user?.firstName || email?.split("@")[0] || "Account";
	const initials = displayName
		.split(/\s+/)
		.map((word) => word[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
	return { user, email, displayName, initials };
}

const UserMenu = () => {
	const t = useTranslation();
	const { signOut } = useClerk();
	const { user, email, displayName, initials } = useDisplayIdentity();

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
				<span className="hidden max-w-32 truncate font-medium text-sm lg:inline">
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
					{t("menuProfile")}
				</DropdownMenuItem>
				<LanguageMenu />
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => signOut({ redirectUrl: "/" })}
				>
					<LogOutIcon className="size-4" />
					{t("menuSignOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// Hamburger + slide-in drawer. Mobile-only (md:hidden); folds the horizontal
// nav and the user menu into one full-height sheet with 44px+ touch rows.
const MobileNav = ({ data }: { data: NavData }) => {
	const t = useTranslation();
	const pathname = usePathname();
	const { signOut } = useClerk();
	const { user, email, displayName, initials } = useDisplayIdentity();
	const [open, setOpen] = useState(false);
	const { links, isAdmin, count, supportCount } = data;

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label={t("navMenu")}
						className="md:hidden"
					/>
				}
			>
				<MenuIcon className="size-5" />
			</SheetTrigger>
			<SheetContent
				side="right"
				className="w-[min(21rem,88vw)] gap-0 border-white/10 p-0"
			>
				<SheetTitle className="sr-only">{t("navMenu")}</SheetTitle>

				<div className="flex items-center gap-3 border-white/10 border-b p-4 pr-12">
					<GoldRingAvatar
						src={user?.imageUrl}
						initials={initials}
						className="size-10"
					/>
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">{displayName}</p>
						{email && (
							<p className="truncate text-muted-foreground text-xs">{email}</p>
						)}
					</div>
				</div>

				<nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
					{links.map(({ href, labelKey, icon: Icon }) => (
						<DrawerRow
							key={labelKey}
							href={href}
							icon={Icon}
							label={t(labelKey)}
							active={href ? pathname === href : false}
							badge={
								href === "/messages" && count > 0
									? count > 99
										? "99+"
										: count
									: undefined
							}
						/>
					))}
					{isAdmin ? (
						<DrawerRow
							href="/admin"
							icon={ShieldIcon}
							label={t("navAdmin")}
							active={pathname?.startsWith("/admin") ?? false}
							badge={
								supportCount > 0
									? supportCount > 99
										? "99+"
										: supportCount
									: undefined
							}
						/>
					) : null}
				</nav>

				<div className="mt-auto flex flex-col gap-1 border-white/10 border-t p-2">
					<DrawerRow
						href="/profile"
						icon={UserIcon}
						label={t("menuProfile")}
						active={pathname === "/profile"}
					/>
					<div className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3">
						<span className="flex items-center gap-3 text-sm">
							<GlobeIcon className="size-5 text-muted-foreground" />
							{t("menuLanguage")}
						</span>
						<LanguageSwitcher />
					</div>
					<button
						type="button"
						onClick={() => {
							setOpen(false);
							signOut({ redirectUrl: "/" });
						}}
						className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-destructive text-sm transition-colors hover:bg-destructive/10"
					>
						<LogOutIcon className="size-5" />
						{t("menuSignOut")}
					</button>
				</div>
			</SheetContent>
		</Sheet>
	);
};

const DrawerRow = ({
	href,
	icon: Icon,
	label,
	active,
	badge,
}: {
	href?: string;
	icon: LucideIcon;
	label: string;
	active?: boolean;
	badge?: string | number;
}) => {
	const className = cn(
		"flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
		active ? "bg-muted text-gold" : "hover:bg-muted",
	);
	const inner = (
		<>
			<Icon className="size-5 shrink-0" />
			<span className="flex-1 truncate">{label}</span>
			{badge !== undefined ? (
				<Badge className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
					{badge}
				</Badge>
			) : null}
		</>
	);
	if (!href) {
		return (
			<button type="button" className={className}>
				{inner}
			</button>
		);
	}
	return (
		<SheetClose render={<Link href={href} />} className={className}>
			{inner}
		</SheetClose>
	);
};

const LanguageMenu = () => {
	const t = useTranslation();
	const { language, setLanguage } = useLanguage();

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<GlobeIcon className="size-4" />
				{t("menuLanguage")}
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

const AuthActions = () => {
	const t = useTranslation();
	return (
		<div className="flex items-center gap-2">
			<div className="hidden sm:block">
				<LanguageSwitcher />
			</div>
			<Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
				{t("authSignIn")}
			</Button>
			<Button
				size="sm"
				className="rounded-full bg-gradient-to-r from-gold to-gold-deep text-black hover:opacity-90"
				render={<Link href="/sign-up" />}
			>
				{t("authSignUp")}
			</Button>
		</div>
	);
};
