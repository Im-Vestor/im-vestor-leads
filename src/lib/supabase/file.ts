import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export async function sendImageToBackend(file: File, userId: string) {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("userId", userId);

	const response = await supabase.functions.invoke("upload-file", {
		body: formData,
	});

	const { data, error } = response as unknown as {
		data: { imageUrl: string };
		error: Error;
	};

	if (error && error instanceof FunctionsHttpError) {
		const errorMessage = await error.context.json();
		console.error("Edge function returned an error", errorMessage);
	}

	if (error) {
		throw new Error(error.message || "Failed to upload file");
	}

	if (!data?.imageUrl) {
		throw new Error("No URL returned from upload");
	}

	return data.imageUrl;
}
