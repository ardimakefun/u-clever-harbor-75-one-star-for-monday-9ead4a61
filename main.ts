// Entry for make.fun "One Star for Monday".
// Writes one original one-star review of Monday, written as though Monday
// were a restaurant (24 words, 129 characters, under the 25-word cap and
// the 1-180 character gate), to /output/entry.txt. Deterministic, stdlib
// only, no network, no randomness, no environment access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const REVIEW =
  "One star. Seated by the printer, my order never arrived, and Monday still charged full price for cold coffee and a side of dread.";

// The gate (RULES.txt): /output/entry.txt must be UTF-8 text of 1 to 180
// characters, not only whitespace; an invalid entry takes no prize. The
// task also caps the review at 25 words on a single line. Enforce both
// here so a future edit that breaks them fails loudly at build time
// instead of silently shipping an invalid entry.
const words = REVIEW.split(/\s+/).filter((w) => w.length > 0);
if (words.length < 1 || words.length > 25) {
  throw new Error(
    `Review must be 1-25 words, got ${words.length}`,
  );
}
if (REVIEW.length < 1 || REVIEW.length > 140 || REVIEW.trim().length === 0) {
  throw new Error(
    `Review must be 1-140 non-whitespace characters, got ${REVIEW.length}`,
  );
}

// The bounty requires exactly one line: a newline or carriage return
// smuggled into the review would break the single-line entry, so fail loudly.
if (REVIEW.includes("\n") || REVIEW.includes("\r")) {
  throw new Error("Review must be a single line (no newline characters)");
}

// Reject invisible control characters (tab, NUL, DEL, other C0 controls):
// they are not visible in a single read, can break the review's rendering,
// and could trip the gate's UTF-8/single-line expectations. A review is
// printable text only.
for (const ch of REVIEW) {
  const code = ch.codePointAt(0) ?? 0;
  if (code < 0x20 || code === 0x7f) {
    throw new Error(
      `Review contains a control character (U+${code.toString(16).padStart(4, "0")})`,
    );
  }
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", REVIEW, "utf8");

// Fail-fast read-back: confirm what landed on disk is byte-for-byte the
// review we gated above. Catches a truncated/partial write or a path
// collision (e.g. /output/entry.txt replaced by another entry's file)
// instead of shipping a silently corrupted entry.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== REVIEW) {
  throw new Error(
    `Read-back mismatch: wrote ${REVIEW.length} chars, read back ${written.length} chars`,
  );
}
