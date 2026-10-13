/**
 * Texts may contain "[…]" placeholders still to be written (textes-application.md, conventions).
 * They are never shown: the bracketed part is removed, and a text that is only a placeholder
 * becomes null so that its block is hidden.
 */
const placeholder = /\s*\[[^\]]*\]\s*/g;

export function hasPlaceholder(text: string): boolean {
  return /\[[^\]]*\]/.test(text);
}

export function withoutPlaceholders(text: string): string | null {
  const cleaned = text.replace(placeholder, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}
