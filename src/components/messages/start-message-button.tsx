"use client";

import { MessageSquareIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { startConversationFromProfile } from "@/app/messages/start.actions";
import { Button } from "@/components/ui/button";

type Props = {
	targetUserId: string;
	label?: string;
	variant?: "default" | "outline" | "secondary" | "ghost";
	/** Match whatever it sits next to — card footers pair it with `sm` buttons. */
	size?: "sm" | "default";
};

export function StartMessageButton({
	targetUserId,
	label = "Send message",
	variant = "default",
	size = "default",
}: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const onClick = () => {
		startTransition(async () => {
			const result = await startConversationFromProfile({ targetUserId });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			router.push(`/messages?c=${result.data.conversationId}`);
		});
	};

	// No margin or size on the icon: the button's own `gap` and size variant
	// handle both, so it stays in step whatever size the caller picks.
	return (
		<Button
			variant={variant}
			size={size}
			onClick={onClick}
			disabled={isPending}
		>
			<MessageSquareIcon />
			{isPending ? "Opening…" : label}
		</Button>
	);
}
