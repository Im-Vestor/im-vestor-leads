import type React from "react";
import { useRef } from "react";

interface SpotlightCardProps extends React.PropsWithChildren {
	className?: string;
	spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
	children,
	className = "",
	spotlightColor = "rgba(237, 214, 137, 0.16)",
}) => {
	const divRef = useRef<HTMLDivElement>(null);

	const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const el = divRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
		el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: mouse handler only drives a decorative spotlight; no interaction semantics
		<div
			ref={divRef}
			onMouseMove={handleMouseMove}
			className={`group/spot relative overflow-hidden ${className}`}
		>
			{children}
			<div
				className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out group-hover/spot:opacity-60"
				style={{
					background: `radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 80%)`,
				}}
			/>
		</div>
	);
};

export default SpotlightCard;
