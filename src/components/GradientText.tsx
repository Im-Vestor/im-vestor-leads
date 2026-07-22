import type { ReactNode } from "react";

interface GradientTextProps {
	children: ReactNode;
	className?: string;
	colors?: string[];
	animationSpeed?: number;
}

export default function GradientText({
	children,
	className = "",
	colors = ["#5227FF", "#FF9FFC", "#B497CF"],
	animationSpeed = 8,
}: GradientTextProps) {
	return (
		<div
			className={`mx-auto w-fit bg-clip-text text-transparent ${className}`}
			style={{
				backgroundImage: `linear-gradient(to right, ${[...colors, colors[0]].join(", ")})`,
				backgroundSize: "300% 100%",
				animation: `gradient-flow ${animationSpeed}s ease infinite`,
			}}
		>
			{children}
		</div>
	);
}
