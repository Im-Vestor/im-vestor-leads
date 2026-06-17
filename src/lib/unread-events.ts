/**
 * Lightweight cross-component signals so unread badges in the header/nav can
 * refresh the moment a conversation is read elsewhere in the tree (the badge
 * and the chat view are siblings, not parent/child, so props can't bridge them).
 */
const MESSAGES_READ = "imv:messages-read";
const SUPPORT_READ = "imv:support-read";

function emit(name: string) {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(name));
	}
}

function subscribe(name: string, handler: () => void) {
	if (typeof window === "undefined") return () => {};
	window.addEventListener(name, handler);
	return () => window.removeEventListener(name, handler);
}

export const emitMessagesRead = () => emit(MESSAGES_READ);
export const subscribeMessagesRead = (handler: () => void) =>
	subscribe(MESSAGES_READ, handler);

export const emitSupportRead = () => emit(SUPPORT_READ);
export const subscribeSupportRead = (handler: () => void) =>
	subscribe(SUPPORT_READ, handler);
