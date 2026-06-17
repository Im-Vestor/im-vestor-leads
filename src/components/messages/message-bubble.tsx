import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

type MessageBubbleProps = {
	content: string;
	createdAt: Date;
	isOwn: boolean;
	senderName: string;
	senderIsSupport?: boolean;
};

export function MessageBubble({
	content,
	createdAt,
	isOwn,
	senderName,
	senderIsSupport,
}: MessageBubbleProps) {
	return (
		<div
			className={cn(
				"flex items-end gap-2",
				isOwn ? "justify-end" : "justify-start",
			)}
		>
			{!isOwn ? (
				<UserAvatar name={senderName} support={senderIsSupport} size="sm" />
			) : null}
			<div className={cn("flex max-w-[75%] flex-col", isOwn && "items-end")}>
				<div
					className={cn(
						"whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
						isOwn
							? "rounded-br-sm bg-primary text-primary-foreground"
							: "rounded-bl-sm bg-muted text-foreground",
					)}
				>
					{content}
				</div>
				<span className="mt-1 px-1 text-[10px] text-muted-foreground">
					{format(createdAt, "HH:mm")}
				</span>
			</div>
		</div>
	);
}
