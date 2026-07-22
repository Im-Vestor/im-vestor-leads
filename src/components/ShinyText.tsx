interface ShinyTextProps {
	text: string;
	speed?: number;
	className?: string;
	color?: string;
	shineColor?: string;
}

const ShinyText = ({
	text,
	speed = 3,
	className = "",
	color = "#b5b5b5",
	shineColor = "#ffffff",
}: ShinyTextProps) => (
	<span
		className={`inline-block bg-clip-text text-transparent ${className}`}
		style={{
			backgroundImage: `linear-gradient(120deg, ${color} 40%, ${shineColor} 50%, ${color} 60%)`,
			backgroundSize: "200% 100%",
			animation: `shine ${speed}s linear infinite`,
		}}
	>
		{text}
	</span>
);

export default ShinyText;
