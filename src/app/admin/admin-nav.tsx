"use client";

import { LayoutDashboardIcon, LifeBuoyIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUnreadSupportCount } from "@/hooks/use-unread-support-count";

const LINKS = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/admin/support", label: "Support inbox", icon: LifeBuoyIcon },
	{ href: "/admin/conversations", label: "Moderation", icon: ShieldIcon },
] as const;

export function AdminNav() {
	const pathname = usePathname();
	const { count: supportCount } = useUnreadSupportCount(true);

	return (
		<nav className="flex flex-wrap items-center gap-1 border-b border-border pb-3">
			{LINKS.map(({ href, label, icon: Icon }) => (
				<Button
					key={href}
					variant={pathname === href ? "secondary" : "ghost"}
					size="sm"
					className="relative"
					render={<Link href={href} />}
				>
					<Icon className="size-4" />
					{label}
					{href === "/admin/support" && supportCount > 0 ? (
						<Badge className="ml-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
							{supportCount > 99 ? "99+" : supportCount}
						</Badge>
					) : null}
				</Button>
			))}
		</nav>
	);
}
