/**
 * Email-safe mirror of the app's design tokens (`globals.css`).
 *
 * The app styles in `oklch`, which most mail clients cannot parse, so every
 * token here is a flat hex approximation of the same colour. Keep the two in
 * sync when the palette changes.
 */
export const brand = {
	background: "#030014",
	surface: "#16102d",
	surfaceSoft: "#1c1638",
	border: "#2b2545",
	borderSoft: "#221b3d",
	foreground: "#fbf8f1",
	muted: "#b0a6c4",
	gold: "#edd689",
	goldDeep: "#d3b662",
	onGold: "#1a1330",
	danger: "#f47272",
	success: "#8fd6a4",
} as const;

export const fontStack =
	"'DM Sans','Helvetica Neue',Helvetica,Arial,'Segoe UI',Roboto,sans-serif";

export const radius = {
	card: "14px",
	panel: "10px",
	button: "8px",
} as const;
