export function slugifyTitle(title: string): string {
  if (!title) return "";
  // Keep all Unicode letters and numbers; remove punctuation except spaces and dashes
  return title
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
