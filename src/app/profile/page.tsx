import { redirect } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";
import { ProfileForm } from "./profile-form";
import { Wallet } from "./wallet";

export default async function ProfilePage() {
	const t = await getT();
	const user = await getOrCreateUser();
	if (!user) redirect("/sign-in");

	const [areas, myAreas] = await Promise.all([
		prisma.area.findMany({
			orderBy: { name: "asc" },
			select: { id: true, name: true },
		}),
		prisma.user.findUnique({
			where: { id: user.id },
			select: { areasOfInterest: { select: { id: true } } },
		}),
	]);

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:py-12">
			<Card>
				<CardHeader>
					<CardTitle>{t("profPageTitle")}</CardTitle>
					<CardDescription>{t("profPageDescription")}</CardDescription>
				</CardHeader>
				<CardContent>
					<ProfileForm
						areas={areas}
						initial={{
							name: user.name ?? "",
							email: user.email,
							country: user.country ?? "",
							role: user.role,
							investmentCapacity: user.investmentCapacity,
							areaIds: myAreas?.areasOfInterest.map((a) => a.id) ?? [],
							referralCode: user.referralCode,
						}}
					/>
				</CardContent>
			</Card>

			<Wallet
				pokes={user.pokes}
				leadCredits={user.leadCredits}
				hypertrainTickets={user.hypertrainTickets}
				subscriptionPlan={user.subscriptionPlan}
				subscriptionStatus={user.subscriptionStatus}
				canManageBilling={Boolean(user.stripeCustomerId)}
			/>
		</div>
	);
}
