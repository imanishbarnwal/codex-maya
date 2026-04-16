export type TelegramIntent = { recipient: string; text: string };

const PRONOUNS = new Set([
  "me",
  "you",
  "us",
  "we",
  "them",
  "him",
  "her",
  "it",
  "everyone",
  "anyone",
  "someone",
  "myself",
  "yourself",
  "that",
  "this",
  "there",
  "here",
]);

const ACTION = "(?:message|msg|send|text|dm|ping|telegram|tell|whatsapp)";

export function parseTelegramIntent(raw: string): TelegramIntent | null {
  if (!raw) return null;
  const text = raw.trim();

  // Matches: "<action> <Name> [:|,|-|that|saying] <content>"
  const re = new RegExp(
    `\\b${ACTION}\\s+([A-Za-z][A-Za-z'-]{1,30})\\s*(?::|,|-|\\bthat\\b|\\bsaying\\b)?\\s+(.+)$`,
    "i",
  );
  const match = text.match(re);
  if (!match) return null;

  const recipient = match[1].trim();
  let content = match[2].trim();

  if (PRONOUNS.has(recipient.toLowerCase())) return null;
  content = content.replace(/^(that|saying|on\s+telegram)\s+/i, "").trim();
  if (content.length < 2) return null;

  // Avoid false positives for built-in phrases
  const lowerContent = content.toLowerCase();
  const contentStartsWithQuestion = /^(about|me|who|what|where|why|how)\b/.test(lowerContent);
  if (contentStartsWithQuestion && !raw.toLowerCase().includes("telegram")) return null;

  return { recipient, text: content };
}
