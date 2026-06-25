"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ShopCategory, ShopProduct } from "@/lib/stripe";
import { confirmCheckout, createCheckoutSession } from "./actions";

async function confirmAndToast(sessionId: string) {
	for (let attempt = 0; attempt < 4; attempt++) {
		const res = await confirmCheckout(sessionId);
		if (res.status === "fulfilled") {
			toast.success("Payment confirmed — your balance is updated.");
			return;
		}
		if (res.status === "unpaid") {
			toast.error("Payment didn't go through. You weren't charged.");
			return;
		}
		if (res.status === "error") {
			toast.error("Couldn't confirm your purchase — contact support if charged.");
			return;
		}
		await new Promise((r) => setTimeout(r, 1500));
	}
	toast.info("Payment received — updating your balance, refresh in a moment.");
}

const SECTIONS: { category: ShopCategory; title: string }[] = [
	{ category: "subscription", title: "Memberships" },
	{ category: "pokes", title: "Pokes" },
	{ category: "leads", title: "Lead Credits" },
];

export function ShopClient({ products }: { products: ShopProduct[] }) {
	const [loadingId, setLoadingId] = useState<string | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const status = params.get("checkout");
		const sessionId = params.get("session_id");
		if (!status) return;
		window.history.replaceState(null, "", "/shop");
		if (status === "cancelled") {
			toast.info("Checkout cancelled.");
		} else if (status === "success" && sessionId) {
			void confirmAndToast(sessionId);
		}
	}, []);

	async function buy(product: ShopProduct, recurring: boolean) {
		setLoadingId(product.id);
		try {
			const result = await createCheckoutSession(product.id, recurring);
			if (result.ok) {
				window.location.href = result.url;
				return;
			}
			toast.error(result.error);
		} catch {
			toast.error("Something went wrong. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	return (
		<div className="space-y-10">
			{SECTIONS.map((section) => {
				const items = products.filter((p) => p.category === section.category);
				if (items.length === 0) return null;
				return (
					<section key={section.category} className="space-y-4">
						<h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
							{section.title}
						</h2>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{items.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									isLoading={loadingId === product.id}
									onBuy={buy}
								/>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}

function ProductCard({
	product,
	isLoading,
	onBuy,
}: {
	product: ShopProduct;
	isLoading: boolean;
	onBuy: (product: ShopProduct, recurring: boolean) => void;
}) {
	const [recurring, setRecurring] = useState(false);
	const activePriceId = recurring ? product.recurring?.priceId : product.priceId;
	const priceLabel =
		recurring && product.recurring
			? product.recurring.priceLabel
			: product.priceLabel;
	const unavailable = !activePriceId;
	const isSubscription = recurring || product.mode === "subscription";

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<CardTitle>{product.name}</CardTitle>
				<CardDescription>{product.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow space-y-3">
				{product.recurring ? (
					<div className="inline-flex rounded-md border p-0.5 text-sm">
						<button
							type="button"
							onClick={() => setRecurring(false)}
							className={`rounded px-3 py-1 ${recurring ? "text-muted-foreground" : "bg-secondary"}`}
						>
							One-time
						</button>
						<button
							type="button"
							onClick={() => setRecurring(true)}
							className={`rounded px-3 py-1 ${recurring ? "bg-secondary" : "text-muted-foreground"}`}
						>
							Monthly
						</button>
					</div>
				) : null}
				<p className="font-bold text-2xl tracking-tight">{priceLabel}</p>
			</CardContent>
			<CardFooter>
				<Button
					className="w-full"
					disabled={unavailable || isLoading}
					onClick={() => onBuy(product, recurring)}
				>
					{unavailable
						? "Coming soon"
						: isLoading
							? "Processing…"
							: isSubscription
								? "Subscribe"
								: "Buy now"}
				</Button>
			</CardFooter>
		</Card>
	);
}
