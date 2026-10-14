/**
 * `/llms.txt`: a plain Markdown summary of the public site for AI assistants (llmstxt.org).
 * Pure function so that it can be tested without Next.js; texts come from `messages/fr.json`.
 */
export type LlmsLink = { title: string; url: string; description?: string };
export type LlmsSection = { heading: string; links: LlmsLink[] };

/** One line, no Markdown link syntax: titles and descriptions may come from the database. */
function inline(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();
}

export function buildLlmsTxt({
  title,
  summary,
  facts,
  sections,
}: {
  title: string;
  summary: string;
  facts: string[];
  sections: LlmsSection[];
}): string {
  const lines = [`# ${inline(title)}`, "", `> ${inline(summary)}`, ""];
  for (const fact of facts) lines.push(`- ${inline(fact)}`);
  for (const section of sections) {
    if (section.links.length === 0) continue;
    lines.push("", `## ${inline(section.heading)}`, "");
    for (const link of section.links) {
      const description = link.description ? `: ${inline(link.description)}` : "";
      lines.push(`- [${inline(link.title)}](${link.url})${description}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
