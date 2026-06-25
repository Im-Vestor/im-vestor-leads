"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
	BellIcon,
	GlobeIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	type LucideIcon,
	MessageSquareIcon,
	SearchIcon,
	ShoppingBagIcon,
	UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyUserId } from "@/app/messages/notifications.actions";
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

const NAV_LINKS = [
	{ label: "Explore", icon: SearchIcon },
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
	{ label: "Inbox", icon: BellIcon },
	{ href: "/messages", label: "Chats", icon: MessageSquareIcon },
	{ href: "/shop", label: "Shop", icon: ShoppingBagIcon },
] satisfies { href?: string; label: string; icon: LucideIcon }[];

export const Header = () => {
	const { isSignedIn, isLoaded } = useUser();

	return (
		<header className="mx-auto mb-12 flex w-full max-w-content items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
			<Link
				href="/"
				aria-label="Im-Vestor"
				className="shrink-0 transition-transform hover:scale-105"
			>
				<Image
					src="/logo/imvestor.png"
					alt="Im-Vestor"
					width={28}
					height={28}
				/>
			</Link>

			{isLoaded && isSignedIn && <NavLinks />}

			{isLoaded && (isSignedIn ? <UserMenu /> : <AuthActions />)}
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
				return (
					<Button
						key={label}
						variant={href && pathname === href ? "secondary" : "ghost"}
						size="sm"
						className="relative"
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

const UserMenu = () => {
	const { user } = useUser();
	const { signOut } = useClerk();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="ghost" />}>
				<span className="max-w-32 truncate text-sm font-medium">
					{user?.fullName ?? user?.firstName}
				</span>
				<Avatar className="size-7">
					<AvatarImage src={user?.imageUrl} alt="" />
					<AvatarFallback>
						<UserIcon className="size-4" />
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
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
		<Button size="sm" render={<Link href="/sign-up" />}>
			Sign up
		</Button>
	</div>
);
