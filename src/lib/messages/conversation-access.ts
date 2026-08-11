// Decides whether a conversation's messages are hidden from a given viewer.
// Anonymity/lock is derived at read time (no stored flag), matching hypertrain.
// `true` = locked (messages hidden); `false` = visible.
export function isConversationLocked(i: {
	projectId: string | null; // null = free chat, never a lead/hypertrain chat
	hypertrainUntil: Date | null; // linked project's boost expiry
	viewerPaid: boolean; // this viewer's own unlock exists (ProjectUnlock investor-side / InvestorUnlock entrepreneur-side)
	now: Date;
}): boolean {
	if (i.projectId === null) return false; // free/legacy chat → always open
	if (i.hypertrainUntil && i.hypertrainUntil > i.now) return false; // public window → open
	return !i.viewerPaid; // expired → locked unless the viewer paid for the other side's lead
}
