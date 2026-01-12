// lib/profanity.js
import leoProfanityPkg from "leo-profanity";

const leoProfanity = leoProfanityPkg.default ?? leoProfanityPkg;

// Load dictionary once
leoProfanity.add(leoProfanity.getDictionary("en"));

// Optional custom words
const extra =
  process.env.PROFANITY_EXTRA?.split(",")
    .map((w) => w.trim())
    .filter(Boolean) || [];
if (extra.length) leoProfanity.add(extra);

/* ---------------------------------
   CLEAN TEXT (FIRST LETTER ONLY)
---------------------------------- */
export function cleanText(text = "") {
  try {
    if (!text) return text;

    const badWords = leoProfanity.list(text);
    if (!badWords.length) return text;

    let result = text;

    for (const word of badWords) {
      if (!word || typeof word !== "string") continue;

      const masked =
        word.length <= 1 ? "*" : word[0] + "*".repeat(word.length - 1);

      // Replace ALL occurrences, case-insensitive
      const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
      result = result.replace(re, masked);
    }

    return result;
  } catch {
    // Fail-open
    return text;
  }
}

/* ---------------------------------
   UTILS
---------------------------------- */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
