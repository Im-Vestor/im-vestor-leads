import { supabase } from "@/lib/supabase/client";

export const PROJECT_MEDIA_BUCKET = "project-media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export type UploadKind = "image" | "video";

// Returns a translation key so callers can render it via t().
export function validateMediaFile(kind: UploadKind, file: File) {
	if (kind === "image") {
		if (!IMAGE_MIME_TYPES.includes(file.type)) return "errImageType" as const;
		if (file.size > MAX_IMAGE_BYTES) return "errImageTooLarge" as const;
	} else {
		if (!VIDEO_MIME_TYPES.includes(file.type)) return "errVideoType" as const;
		if (file.size > MAX_VIDEO_BYTES) return "errVideoTooLarge" as const;
	}
	return null;
}

export async function uploadToSignedUrl(
	path: string,
	token: string,
	file: File,
): Promise<void> {
	const { error } = await supabase.storage
		.from(PROJECT_MEDIA_BUCKET)
		.uploadToSignedUrl(path, token, file);
	if (error) throw new Error(error.message || "Upload failed");
}
