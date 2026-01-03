// lib/profanity.js
import leoProfanityPkg from "leo-profanity";

const leoProfanity = leoProfanityPkg.default ?? leoProfanityPkg;

// Load base dictionary ONCE
leoProfanity.add(leoProfanity.getDictionary("en"));

// Optional extra words from env
const extra = process.env.PROFANITY_EXTRA?.split(",")
  .map((w) => w.trim())
  .filter(Boolean);
if (extra?.length) {
  leoProfanity.add(extra);
}

export function cleanText(text = "") {
  try {
    return leoProfanity.clean(text);
  } catch {
    return text; // fail-open
  }
}
