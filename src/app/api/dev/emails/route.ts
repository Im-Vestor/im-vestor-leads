import { env } from "@/env";
import { EMAIL_PREVIEW_NAMES, EMAIL_PREVIEWS } from "@/lib/email/preview";
import { brand, fontStack } from "@/lib/email/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dev-only template gallery: `/api/dev/emails` lists every email,
 * `?template=welcome` renders one, `&format=text` shows the plain-text part.
 */
export async function GET(request: Request) {
	if (env.NODE_ENV === "production") {
		return new Response("Not found", { status: 404 });
	}

	const url = new URL(request.url);
	const name = url.searchParams.get("template");

	if (!name) return new Response(index(), htmlHeaders());

	const preview = EMAIL_PREVIEWS[name];
	if (!preview) {
		return new Response(`Unknown template "${name}"`, { status: 404 });
	}

	const email = preview();
	if (url.searchParams.get("format") === "text") {
		return new Response(`Subject: ${email.subject}\n\n${email.text}`, {
			headers: { "content-type": "text/plain; charset=utf-8" },
		});
	}

	return new Response(email.html, htmlHeaders());
}

function htmlHeaders() {
	return { headers: { "content-type": "text/html; charset=utf-8" } };
}

function index(): string {
	const items = EMAIL_PREVIEW_NAMES.map((name) => {
		const subject = EMAIL_PREVIEWS[name]?.().subject ?? "";
		return `<li style="margin:0 0 10px;">
			<a href="?template=${name}" style="color:${brand.gold};font-weight:600;text-decoration:none;">${name}</a>
			<a href="?template=${name}&format=text" style="margin-left:8px;font-size:12px;color:${brand.muted};">text</a>
			<div style="font-size:13px;color:${brand.muted};">${subject}</div>
		</li>`;
	}).join("");

	return `<!doctype html><html><head><meta charset="utf-8"><title>Email templates</title></head>
<body style="margin:0;padding:40px 24px;background:${brand.background};color:${brand.foreground};font-family:${fontStack};">
	<h1 style="font-size:22px;margin:0 0 24px;">IM-VESTOR email templates</h1>
	<ul style="list-style:none;padding:0;max-width:560px;">${items}</ul>
</body></html>`;
}
