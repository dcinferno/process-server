// lib/profanity.js
import leoProfanityPkg from "leo-profanity";

// Handle CJS / ESM interop safely
const leoProfanity = leoProfanityPkg.default ?? leoProfanityPkg;

// Load base dictionary ONCE
leoProfanity.add(leoProfanity.getDictionary("en"));

// Optional extra words from env
const extra =
  process.env.PROFANITY_EXTRA?.split(",")
    .map((w) => w.trim())
    .filter(Boolean) || [];

if (extra.length) {
  leoProfanity.add(extra);
}

/* ---------------------------------
   CUSTOM CLEANER
---------------------------------- */
export function cleanText(text = "") {
  try {
    return leoProfanity.clean(text, {
      replacement: (word) => {
        if (!word || word.length < 2) return "*";
        return word[0] + "*".repeat(word.length - 1);
      },
    });
  } catch {
    // Fail-open: never break Stripe / Twitter
    return text;
  }
}
