"use client";

import { CheckIcon, HandIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendPoke } from "@/app/pokes/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { POKE_MESSAGE_MAX_LENGTH } from "@/lib/pokes";

type Props = {
	/** Aim at a member directly, or at the founder behind a project. */
	targetUserId?: string;
	projectId?: string;
	pokes: number;
	/** The current user already has an open (pending or accepted) poke here. */
	alreadyPoked?: boolean;
	size?: "sm" | "default";
	variant?: "default" | "outline" | "secondary" | "ghost";
};

/**
 * Spends a poke to ask for contact. The note is optional but it is what the
 * other side judges before accepting, so the dialog leads with it.
 */
export function PokeButton({
	targetUserId,
	projectId,
	pokes,
	alreadyPoked = false,
	size = "sm",
	variant = "outline",
}: Props) {
	const t = useTranslation();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	const outOfPokes = pokes < 1;

	if (alreadyPoked) {
		return (
			<Button
				size={size}
				variant="ghost"
				disabled
				className="text-muted-foreground"
				title={t("pokeAlreadySent")}
			>
				<CheckIcon /> {t("pokePoked")}
			</Button>
		);
	}

	function send() {
		startTransition(async () => {
			const result = await sendPoke({ targetUserId, projectId, message });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			toast.success(t("pokeSentToast"));
			setOpen(false);
			setMessage("");
			router.refresh();
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button
						size={size}
						variant={variant}
						disabled={outOfPokes}
						title={outOfPokes ? t("pokeNoneLeft") : undefined}
					/>
				}
			>
				<HandIcon /> {t("dashPoke")}
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("pokeDialogTitle")}</DialogTitle>
					<DialogDescription>{t("pokeDialogDescription")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-1.5">
					<Textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						maxLength={POKE_MESSAGE_MAX_LENGTH}
						rows={4}
						placeholder={t("pokeMessagePlaceholder")}
					/>
					<p className="text-right text-muted-foreground text-xs">
						{message.length}/{POKE_MESSAGE_MAX_LENGTH}
					</p>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						{t("commonCancel")}
					</Button>
					<Button onClick={send} disabled={isPending}>
						{isPending ? t("commonLoading") : t("pokeSend")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
