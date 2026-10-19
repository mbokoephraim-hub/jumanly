/** « Nadia Kabeya » → « Nadia K. »: how a recruiter appears to a talent (planche talent-2 § 5). */
export function shortName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words[0] ?? "";
  return `${words[0]} ${words.at(-1)!.charAt(0).toLocaleUpperCase("fr")}.`;
}
