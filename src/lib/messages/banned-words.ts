import "server-only";
import { prisma } from "@/lib/prisma";

function escapeRegex(word: string) {
	return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function banPhrase(
	phrase: string,
	createdBy: string,
): Promise<void> {
	const word = phrase.trim().toLowerCase();
	if (!word) return;
	await prisma.bannedWord.upsert({
		where: { word },
		create: { word, createdBy },
		update: {},
	});
}

export async function findBannedWord(content: string): Promise<string | null> {
	const bannedWords = await prisma.bannedWord.findMany({
		select: { word: true },
	});
	if (bannedWords.length === 0) return null;
	const lower = content.toLowerCase();
	for (const { word } of bannedWords) {
		const pattern = new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`);
		if (pattern.test(lower)) return word;
	}
	return null;
}
