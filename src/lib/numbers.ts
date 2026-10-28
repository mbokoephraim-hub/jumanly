/** Splits « De 0 à 19,99 USD » around its last number (French format, spaces as thousands). */
export function splitLastNumber(text: string, locale: "fr" | "en" = "fr") {
  // French: "1 268,5"; English (public site): "1,268.5".
  const pattern =
    locale === "en"
      ? /\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g
      : /\d[\d\u00a0\u202f ]*\d(?:,\d+)?|\d(?:,\d+)?/g;
  const matches = [...text.matchAll(pattern)];
  const match = matches.at(-1);
  if (!match || match.index === undefined) return null;
  const number = match[0].trimEnd();
  const [whole = "", fraction = ""] = number.split(locale === "en" ? "." : ",");
  const value = Number(`${whole.replace(/\D/g, "")}.${fraction || "0"}`);
  if (!Number.isFinite(value)) return null;
  return {
    before: text.slice(0, match.index),
    number,
    after: text.slice(match.index + number.length),
    value,
    decimals: fraction.length,
  };
}
