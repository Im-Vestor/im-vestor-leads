import "server-only";
import { INVESTMENT_RANGE_LABELS, ROLE_LABEL_KEYS } from "@/lib/constants";
import { deliver, sendEmail } from "@/lib/email/send";
import {
	areaRemovedEmail,
	referralJoinedEmail,
	welcomeEmail,
} from "@/lib/email/templates/account";
import {
	paymentFailedEmail,
	purchaseReceiptEmail,
	subscriptionCancelledEmail,
	subscriptionRenewedEmail,
	subscriptionStartedEmail,
} from "@/lib/email/templates/billing";
import {
	newMessageEmail,
	supportReplyEmail,
	supportRequestEmail,
} from "@/lib/email/templates/messages";
import {
	pokeAcceptedEmail,
	pokeReceivedEmail,
	pokeRejectedEmail,
} from "@/lib/email/templates/pokes";
import {
	hypertrainActivatedEmail,
	leadUnlockedForEntrepreneurEmail,
	leadUnlockedForInvestorEmail,
	projectPublishedEmail,
} from "@/lib/email/templates/projects";
import { resolvePresence } from "@/lib/messages/presence";
import { createNotification, createNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getShopProduct, PRODUCT_GRANTS } from "@/lib/stripe";
import { SUPPORT_EMAIL } from "@/lib/support";
import { getTranslation } from "@/utils/translations";

/**
 * One entry point per event: writes the in-app notification that drives the
 * header bell, and sends the email for the ones worth an inbox interruption.
 * Every function returns void and runs after the response — call sites stay
 * synchronous and never pay latency for it.
 */

/**
 * Bursts of chat messages collapse into a single email: if the recipient
 * already has an unread message from the same sender inside this window,
 * they were emailed for it and do not need another one.
 */
const MESSAGE_EMAIL_THROTTLE_MS = 30 * 60_000;

function label(key: Parameters<typeof getTranslation>[1]): string {
	return getTranslation("en-US", key);
}

function displayName(user: { name: string | null; email: string }): string {
	return user.name?.trim() || user.email;
}

/**
 * Emails everyone who had an area on their profile after an admin removes it.
 * Recipients carry a CTA path (entrepreneurs → their projects, investors →
 * profile). De-duplicated by email; fire-and-forget like every other notify.
 */
export function notifyAreaRemoved(input: {
	areaName: string;
	recipients: { email: string; name: string | null; ctaPath: string }[];
}): void {
	deliver(async () => {
		const seen = new Set<string>();
		for (const r of input.recipients) {
			if (!r.email || seen.has(r.email)) continue;
			seen.add(r.email);
			await sendEmail({
				to: r.email,
				tag: "area-removed",
				...areaRemovedEmail({
					recipientName: displayName(r),
					areaName: input.areaName,
					ctaPath: r.ctaPath,
				}),
			});
		}
	});
}

// ---------------------------------------------------------------- account

/**
 * Welcome + referral credit, fired once per account. The guard is an atomic
 * `updateMany` so concurrent sign-up calls cannot double-send.
 */
export function notifyWelcome(clerkId: string): void {
	deliver(async () => {
		const user = await prisma.user.findUnique({
			where: { clerkId },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				referralCode: true,
				referredByCode: true,
				pokes: true,
				leadCredits: true,
			},
		});
		if (!user) return;

		const claimed = await prisma.user.updateMany({
			where: { id: user.id, welcomeEmailSentAt: null },
			data: { welcomeEmailSentAt: new Date() },
		});
		if (claimed.count === 0) return;

		await createNotification({
			userId: user.id,
			type: "WELCOME",
			message: user.referralCode,
			link: "/dashboard",
		});

		await sendEmail({
			to: user.email,
			tag: "welcome",
			...welcomeEmail({
				name: user.name,
				role: user.role,
				referralCode: user.referralCode,
				pokes: user.pokes,
				leadCredits: user.leadCredits,
			}),
		});

		if (!user.referredByCode) return;

		const referrer = await prisma.user.findUnique({
			where: { referralCode: user.referredByCode },
			select: { id: true, email: true, name: true },
		});
		if (!referrer) return;

		await createNotification({
			userId: referrer.id,
			type: "REFERRAL_JOINED",
			message: displayName(user),
			link: "/profile",
			senderId: user.id,
		});

		await sendEmail({
			to: referrer.email,
			tag: "referral-joined",
			...referralJoinedEmail({
				referrerName: referrer.name,
				newMemberName: user.name,
				newMemberRole: user.role,
				referralCode: user.referredByCode,
			}),
		});
	});
}

// --------------------------------------------------------------- projects

export function notifyProjectPublished(projectId: string): void {
	deliver(async () => {
		const project = await prisma.project.findUnique({
			where: { id: projectId },
			select: {
				id: true,
				name: true,
				investmentGoal: true,
				currency: true,
				equity: true,
				videoPitchUrl: true,
				entrepreneurId: true,
				entrepreneur: { select: { email: true } },
				_count: { select: { media: true } },
			},
		});
		if (!project?.entrepreneur) return;

		await createNotification({
			userId: project.entrepreneurId,
			type: "PROJECT_PUBLISHED",
			message: project.name,
			link: `/projects/${project.id}`,
		});

		await sendEmail({
			to: project.entrepreneur.email,
			tag: "project-published",
			...projectPublishedEmail({
				projectId: project.id,
				projectName: project.name,
				investmentGoal: project.investmentGoal,
				currency: project.currency,
				equity: project.equity,
				hasMedia: project._count.media > 0,
				hasVideoPitch: Boolean(project.videoPitchUrl),
			}),
		});
	});
}

/** Both sides of an unlock: the founder gets a lead, the investor a receipt. */
export function notifyLeadUnlocked(input: {
	projectId: string;
	investorId: string;
}): void {
	deliver(async () => {
		const [project, investor] = await Promise.all([
			prisma.project.findUnique({
				where: { id: input.projectId },
				select: {
					id: true,
					name: true,
					investmentGoal: true,
					currency: true,
					entrepreneurId: true,
					entrepreneur: { select: { email: true, name: true } },
				},
			}),
			prisma.user.findUnique({
				where: { id: input.investorId },
				select: {
					email: true,
					name: true,
					country: true,
					investmentCapacity: true,
					areasOfInterest: { select: { name: true } },
					leadCredits: true,
				},
			}),
		]);
		if (!project?.entrepreneur || !investor) return;

		const investorName = displayName(investor);

		await createNotifications([
			{
				userId: project.entrepreneurId,
				type: "LEAD_UNLOCKED",
				message: `${investorName} · ${project.name}`,
				link: "/messages",
				senderId: input.investorId,
			},
			{
				userId: input.investorId,
				type: "LEAD_UNLOCKED",
				message: project.name,
				link: `/projects/${project.id}`,
			},
		]);

		await sendEmail({
			to: project.entrepreneur.email,
			tag: "lead-unlocked-founder",
			...leadUnlockedForEntrepreneurEmail({
				projectId: project.id,
				projectName: project.name,
				investorName,
				investorCountry: investor.country,
				investorCapacity: investor.investmentCapacity
					? INVESTMENT_RANGE_LABELS[investor.investmentCapacity]
					: null,
				investorSectors: investor.areasOfInterest.map((a) => a.name),
			}),
		});

		await sendEmail({
			to: investor.email,
			tag: "lead-unlocked-investor",
			...leadUnlockedForInvestorEmail({
				projectId: project.id,
				projectName: project.name,
				founderName: displayName({
					name: project.entrepreneur.name,
					email: project.entrepreneur.email,
				}),
				investmentGoal: project.investmentGoal,
				currency: project.currency,
				creditsLeft: investor.leadCredits,
			}),
		});
	});
}

export function notifyHypertrainActivated(input: {
	userId: string;
	target: "project" | "profile";
	projectId?: string;
	until: Date;
	days: number;
}): void {
	deliver(async () => {
		const user = await prisma.user.findUnique({
			where: { id: input.userId },
			select: { email: true, name: true, hypertrainTickets: true },
		});
		if (!user) return;

		let subjectName = displayName(user);
		if (input.target === "project" && input.projectId) {
			const project = await prisma.project.findUnique({
				where: { id: input.projectId },
				select: { name: true },
			});
			if (!project) return;
			subjectName = project.name;
		}

		await createNotification({
			userId: input.userId,
			type: "HYPERTRAIN_ACTIVATED",
			message: subjectName,
			link: input.projectId ? `/projects/${input.projectId}` : "/dashboard",
		});

		await sendEmail({
			to: user.email,
			tag: "hypertrain-activated",
			...hypertrainActivatedEmail({
				target: input.target,
				subjectName,
				projectId: input.projectId,
				until: input.until,
				ticketsLeft: user.hypertrainTickets,
				days: input.days,
			}),
		});
	});
}

// ------------------------------------------------------------------ pokes

/**
 * A poke is a question, and it is worth an inbox interruption: it sits there
 * costing the sender a credit until the receiver answers. The in-app row is
 * written by `sendPoke` inside its transaction — it carries the poke id the
 * bell's buttons act on — so this only sends the email.
 */
export function notifyPokeReceived(input: { pokeId: string }): void {
	deliver(async () => {
		const poke = await prisma.poke.findUnique({
			where: { id: input.pokeId },
			select: {
				message: true,
				sender: {
					select: { name: true, email: true, role: true, country: true },
				},
				receiver: { select: { email: true } },
			},
		});
		if (!poke) return;

		await sendEmail({
			to: poke.receiver.email,
			tag: "poke-received",
			...pokeReceivedEmail({
				senderName: displayName(poke.sender),
				senderRole: poke.sender.role,
				senderCountry: poke.sender.country,
				message: poke.message,
			}),
		});
	});
}

/**
 * The answer, mailed back to whoever spent the poke. The in-app row is written
 * by `respondToPoke`, which also hands over the conversation it opened.
 */
export function notifyPokeAnswered(input: {
	pokeId: string;
	accepted: boolean;
	conversationId: string | null;
}): void {
	deliver(async () => {
		const poke = await prisma.poke.findUnique({
			where: { id: input.pokeId },
			select: {
				sender: { select: { email: true, pokes: true } },
				receiver: { select: { name: true, email: true } },
			},
		});
		if (!poke) return;

		const receiverName = displayName(poke.receiver);

		if (!input.accepted) {
			await sendEmail({
				to: poke.sender.email,
				tag: "poke-rejected",
				...pokeRejectedEmail({
					receiverName,
					pokeBalance: poke.sender.pokes,
				}),
			});
			return;
		}

		await sendEmail({
			to: poke.sender.email,
			tag: "poke-accepted",
			...pokeAcceptedEmail({
				receiverName,
				conversationId: input.conversationId,
			}),
		});
	});
}

// --------------------------------------------------------------- messages

type MessageNotification = {
	conversationId: string;
	messageId: string;
	senderId: string;
	recipientIds: string[];
	preview: string;
};

/** True when the recipient is away from the app and not already emailed. */
async function shouldEmailAboutMessage(
	recipient: { lastSeenAt: Date | null; lastActiveAt: Date | null },
	input: Pick<MessageNotification, "conversationId" | "messageId" | "senderId">,
): Promise<boolean> {
	if (
		resolvePresence(recipient.lastSeenAt, recipient.lastActiveAt) !== "offline"
	) {
		return false;
	}

	// Delivery runs after the response is flushed, so the recipient may have
	// opened the thread in between. Never email about a message they have
	// already read — the copy promises we only nudge about what they missed.
	const stillUnread = await prisma.message.count({
		where: { id: input.messageId, readAt: null },
	});
	if (stillUnread === 0) return false;

	const alreadyPending = await prisma.message.count({
		where: {
			conversationId: input.conversationId,
			senderId: input.senderId,
			readAt: null,
			id: { not: input.messageId },
			createdAt: { gte: new Date(Date.now() - MESSAGE_EMAIL_THROTTLE_MS) },
		},
	});
	return alreadyPending === 0;
}

/**
 * A member-to-member message; also feeds the support inbox. The in-app
 * notification row is written by `sendMessage` inside its transaction, so this
 * only decides who deserves an email.
 */
export function notifyNewMessage(input: MessageNotification): void {
	if (input.recipientIds.length === 0) return;

	deliver(async () => {
		const [sender, recipients] = await Promise.all([
			prisma.user.findUnique({
				where: { id: input.senderId },
				select: { name: true, email: true, role: true },
			}),
			prisma.user.findMany({
				where: { id: { in: input.recipientIds } },
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					lastSeenAt: true,
					lastActiveAt: true,
				},
			}),
		]);
		if (!sender) return;

		const senderName = displayName(sender);

		for (const recipient of recipients) {
			if (!(await shouldEmailAboutMessage(recipient, input))) continue;

			if (recipient.email === SUPPORT_EMAIL) {
				await sendEmail({
					to: recipient.email,
					tag: "support-request",
					...supportRequestEmail({
						memberName: senderName,
						memberEmail: sender.email,
						memberRole: label(ROLE_LABEL_KEYS[sender.role]),
						preview: input.preview,
					}),
				});
				continue;
			}

			const unreadCount = await prisma.message.count({
				where: {
					NOT: { senderId: recipient.id },
					readAt: null,
					conversation: { participants: { some: { id: recipient.id } } },
				},
			});

			await sendEmail({
				to: recipient.email,
				tag: "new-message",
				...newMessageEmail({
					senderName,
					senderRole: sender.role,
					preview: input.preview,
					unreadCount,
				}),
			});
		}
	});
}

/** Support answered a thread — same offline rule, member-facing copy. */
export function notifySupportReply(input: MessageNotification): void {
	if (input.recipientIds.length === 0) return;

	deliver(async () => {
		const recipients = await prisma.user.findMany({
			where: { id: { in: input.recipientIds } },
			select: {
				id: true,
				email: true,
				name: true,
				lastSeenAt: true,
				lastActiveAt: true,
			},
		});

		for (const recipient of recipients) {
			if (!(await shouldEmailAboutMessage(recipient, input))) continue;

			await sendEmail({
				to: recipient.email,
				tag: "support-reply",
				...supportReplyEmail({
					memberName: recipient.name,
					preview: input.preview,
				}),
			});
		}
	});
}

// ---------------------------------------------------------------- billing

/** Post-fulfilment receipt for anything bought in the shop. */
export function notifyPurchase(input: {
	userId: string;
	productId: string;
	quantity?: number;
	recurring?: boolean;
	/** Overrides the catalog grant when fulfilment credited a different amount. */
	pokesGranted?: number;
}): void {
	deliver(async () => {
		const product = getShopProduct(input.productId);
		const grant = PRODUCT_GRANTS[input.productId];
		if (!product || !grant) return;

		const user = await prisma.user.findUnique({
			where: { id: input.userId },
			select: {
				email: true,
				pokes: true,
				leadCredits: true,
				hypertrainTickets: true,
			},
		});
		if (!user) return;

		if (grant.plan) {
			await createNotification({
				userId: input.userId,
				type: "SUBSCRIPTION_STARTED",
				message: product.name,
				link: "/profile",
			});

			await sendEmail({
				to: user.email,
				tag: "subscription-started",
				...subscriptionStartedEmail({
					planName: product.name,
					priceLabel: product.priceLabel,
					pokesGranted: grant.pokes ?? 0,
					features: product.features ?? [],
				}),
			});
			return;
		}

		const quantity = input.quantity ?? 1;
		const priceLabel =
			(input.recurring ? product.recurring?.priceLabel : product.priceLabel) ??
			product.priceLabel;
		const pokesGranted = input.pokesGranted ?? grant.pokes ?? 0;

		const granted: { label: string; value: string }[] = [];
		if (pokesGranted > 0) {
			granted.push({ label: "Pokes added", value: `+${pokesGranted}` });
		}
		if (grant.leadCredits) {
			granted.push({
				label: "Lead credits added",
				value: `+${grant.leadCredits * quantity}`,
			});
		}
		if (grant.hypertrainTickets) {
			granted.push({
				label: "Hyper Train tickets added",
				value: `+${grant.hypertrainTickets * quantity}`,
			});
		}

		await createNotification({
			userId: input.userId,
			type: "PURCHASE_COMPLETED",
			message: quantity > 1 ? `${product.name} × ${quantity}` : product.name,
			link: "/profile",
		});

		await sendEmail({
			to: user.email,
			tag: "purchase-receipt",
			...purchaseReceiptEmail({
				productName: product.name,
				priceLabel,
				quantity,
				granted,
				balances: [
					{ label: "Pokes", value: String(user.pokes) },
					{ label: "Lead credits", value: String(user.leadCredits) },
					{
						label: "Hyper Train tickets",
						value: String(user.hypertrainTickets),
					},
				],
			}),
		});
	});
}

export function notifySubscriptionRenewed(input: {
	userId: string;
	productId: string;
}): void {
	deliver(async () => {
		const product = getShopProduct(input.productId);
		const grant = PRODUCT_GRANTS[input.productId];
		if (!product || !grant?.pokes) return;

		const user = await prisma.user.findUnique({
			where: { id: input.userId },
			select: { email: true, pokes: true },
		});
		if (!user) return;

		await createNotification({
			userId: input.userId,
			type: "SUBSCRIPTION_RENEWED",
			message: `${product.name} · +${grant.pokes}`,
			link: "/profile",
		});

		await sendEmail({
			to: user.email,
			tag: "subscription-renewed",
			...subscriptionRenewedEmail({
				planName: product.name,
				pokesGranted: grant.pokes,
				pokeBalance: user.pokes,
			}),
		});
	});
}

export function notifySubscriptionCancelled(input: {
	stripeCustomerId: string;
	planName: string;
}): void {
	deliver(async () => {
		const user = await prisma.user.findFirst({
			where: { stripeCustomerId: input.stripeCustomerId },
			select: { id: true, email: true, pokes: true, leadCredits: true },
		});
		if (!user) return;

		await createNotification({
			userId: user.id,
			type: "SUBSCRIPTION_CANCELLED",
			message: input.planName,
			link: "/shop",
		});

		await sendEmail({
			to: user.email,
			tag: "subscription-cancelled",
			...subscriptionCancelledEmail({
				planName: input.planName,
				pokes: user.pokes,
				leadCredits: user.leadCredits,
			}),
		});
	});
}

export function notifyPaymentFailed(input: {
	stripeCustomerId: string;
	planName: string;
	amountLabel: string;
	attemptsLeft: boolean;
}): void {
	deliver(async () => {
		const user = await prisma.user.findFirst({
			where: { stripeCustomerId: input.stripeCustomerId },
			select: { id: true, email: true },
		});
		if (!user) return;

		await createNotification({
			userId: user.id,
			type: "PAYMENT_FAILED",
			message: `${input.planName} · ${input.amountLabel}`,
			link: "/profile",
		});

		await sendEmail({
			to: user.email,
			tag: "payment-failed",
			...paymentFailedEmail({
				planName: input.planName,
				amountLabel: input.amountLabel,
				attemptsLeft: input.attemptsLeft,
			}),
		});
	});
}
