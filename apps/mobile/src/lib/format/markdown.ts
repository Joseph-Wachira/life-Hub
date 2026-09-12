/** Strips common markdown syntax down to a plain-text snippet for list previews. */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#*_`>~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
