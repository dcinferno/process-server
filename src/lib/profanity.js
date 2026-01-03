// lib/profanity.js
import leoProfanityPkg from "leo-profanity";

const leoProfanity = leoProfanityPkg.default ?? leoProfanityPkg;

// Load dictionary once
leoProfanity.add(leoProfanity.getDictionary("en"));

// Optional extra words
const extra =
  process.env.PROFANITY_EXTRA?.split(",")
    .map((w) => w.trim())
    .filter(Boolean) || [];
if (extra.length) leoProfanity.add(extra);

/* ---------------------------------
   SAFE CLEANER
---------------------------------- */
export function cleanText(text = "") {
  try {
    return leoProfanity.clean(text, {
      replacement: (match) => {
        // 🔑 Normalize match to string
        const word =
          typeof match === "string"
            ? match
            : match?.original || match?.value || "";

        if (!word) return "";

        // Keep first letter, mask rest
        if (word.length <= 1) return "*";
        return word[0] + "*".repeat(word.length - 1);
      },
    });
  } catch {
    // Fail open — never break UI / Stripe / Twitter
    return text;
  }
}
