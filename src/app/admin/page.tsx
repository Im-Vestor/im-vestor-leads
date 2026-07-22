import {
	ArrowRightIcon,
	LifeBuoyIcon,
	MessageSquareIcon,
	ShieldIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getOrCreateSupportUser, SUPPORT_CLERK_ID } from "@/lib/support";
import { getT } from "@/utils/translations/server";

async function getStats() {
	const support = await getOrCreateSupportUser();

	const [
		totalUsers,
		totalConversations,
		totalMessages,
		bannedWords,
		openThreads,
	] = await Promise.all([
		prisma.user.count({ where: { NOT: { clerkId: SUPPORT_CLERK_ID } } }),
		prisma.conversation.count(),
		prisma.message.count(),
		prisma.bannedWord.count(),
		prisma.conversation.count({
			where: {
				participants: { some: { id: support.id } },
				messages: { some: { NOT: { senderId: support.id }, readAt: null } },
			},
		}),
	]);

	return {
		totalUsers,
		totalConversations,
		totalMessages,
		bannedWords,
		openThreads,
	};
}

function StatCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: number;
	icon: typeof UsersIcon;
}) {
	return (
		<Card>
			<CardContent className="flex items-center gap-4 py-5">
				<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
					<Icon className="size-5 text-muted-foreground" />
				</div>
				<div>
					<div className="text-2xl font-bold tabular-nums">{value}</div>
					<div className="text-xs text-muted-foreground">{label}</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default async function AdminDashboardPage() {
	const stats = await getStats();
	const t = await getT();

	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<div>
				<h1 className="text-2xl font-bold">{t("adminDashboardTitle")}</h1>
				<p className="text-sm text-muted-foreground">
					{t("adminDashboardSubtitle")}
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={t("adminDashboardUsers")}
					value={stats.totalUsers}
					icon={UsersIcon}
				/>
				<StatCard
					label={t("adminDashboardConversations")}
					value={stats.totalConversations}
					icon={MessageSquareIcon}
				/>
				<StatCard
					label={t("adminDashboardMessages")}
					value={stats.totalMessages}
					icon={MessageSquareIcon}
				/>
				<StatCard
					label={t("adminDashboardBannedWords")}
					value={stats.bannedWords}
					icon={ShieldIcon}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<LifeBuoyIcon className="size-4" />
							{t("adminDashboardSupportInbox")}
						</CardTitle>
						<CardDescription>
							{stats.openThreads > 0 ? (
								<>
									{stats.openThreads} {t("adminDashboardConversationsWaiting")}
								</>
							) : (
								t("adminDashboardNoThreadsWaiting")
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button render={<Link href="/admin/support" />}>
							{t("adminDashboardOpenSupportInbox")}
							<ArrowRightIcon className="size-4" />
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<ShieldIcon className="size-4" />
							{t("adminDashboardModeration")}
						</CardTitle>
						<CardDescription>
							{t("adminDashboardModerationDesc")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							variant="outline"
							render={<Link href="/admin/conversations" />}
						>
							{t("adminDashboardOpenModeration")}
							<ArrowRightIcon className="size-4" />
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
