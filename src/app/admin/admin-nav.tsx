"use client";

import { LayoutDashboardIcon, LifeBuoyIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useUnreadSupportCount } from "@/hooks/use-unread-support-count";

const LINKS = [
	{ href: "/admin", labelKey: "adminNavDashboard", icon: LayoutDashboardIcon },
	{
		href: "/admin/support",
		labelKey: "adminNavSupportInbox",
		icon: LifeBuoyIcon,
	},
	{
		href: "/admin/conversations",
		labelKey: "adminNavModeration",
		icon: ShieldIcon,
	},
] as const;

export function AdminNav() {
	const pathname = usePathname();
	const { count: supportCount } = useUnreadSupportCount(true);
	const t = useTranslation();

	return (
		<nav className="flex items-center gap-1 overflow-x-auto border-b border-border pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap [&::-webkit-scrollbar]:hidden">
			{LINKS.map(({ href, labelKey, icon: Icon }) => (
				<Button
					key={href}
					variant={pathname === href ? "secondary" : "ghost"}
					size="sm"
					className="relative min-h-11 md:min-h-0"
					render={<Link href={href} />}
				>
					<Icon className="size-4" />
					{t(labelKey)}
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
