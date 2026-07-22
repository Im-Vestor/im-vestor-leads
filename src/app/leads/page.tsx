import { redirect } from "next/navigation";
import { StartMessageButton } from "@/components/messages/start-message-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getDisplayName } from "@/lib/messages/display-name";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";

export default async function LeadsPage() {
	const t = await getT();
	const me = await getOrCreateUser();
	if (!me) redirect("/sign-in");

	const others = await prisma.user.findMany({
		where: { id: { not: me.id } },
		orderBy: { createdAt: "desc" },
		take: 50,
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			country: true,
		},
	});

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>{t("projLeads")}</CardTitle>
					<CardDescription>{t("projLeadsDesc")}</CardDescription>
				</CardHeader>
				<CardContent>
					{others.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("projNoOtherUsers")}
						</p>
					) : (
						<ul className="flex flex-col gap-3">
							{others.map((u) => (
								<li
									key={u.id}
									className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
								>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-medium">
											{getDisplayName(u)}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{u.role} {u.country ? `· ${u.country}` : ""}
										</span>
									</div>
									<StartMessageButton targetUserId={u.id} variant="outline" />
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
