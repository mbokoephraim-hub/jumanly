import { displayLocale } from "./display-locale";

/**
 * A person's country as the profile shows it (docs/profil-personne § En-tête 6): the flag drawn
 * from the ISO code of `User.country` (no external picture), the name in French and the local
 * time. Older accounts may hold a name (« RD Congo »): it is turned back into its code.
 */

const ISO = /^[A-Z]{2}$/;

/** Names some accounts hold instead of a code. */
const ALIASES: Record<string, string> = {
  "rd congo": "CD",
  rdc: "CD",
  "congo-kinshasa": "CD",
  "congo kinshasa": "CD",
  "congo-brazzaville": "CG",
  "congo brazzaville": "CG",
  "cote d'ivoire": "CI",
  "cote divoire": "CI",
};

const fold = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[’`]/g, "'").trim();

let names: Map<string, string> | null = null;

/** Every region code Intl knows, by its French name (built once). */
function nameIndex() {
  if (names) return names;
  names = new Map();
  const display = new Intl.DisplayNames(["fr"], { type: "region" });
  for (let a = 65; a <= 90; a++)
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      let name: string | undefined;
      try {
        name = display.of(code);
      } catch {
        continue;
      }
      if (name && name !== code) names.set(fold(name), code);
    }
  return names;
}

/** « CD », « cd », « RD Congo » or « Ghana » → « CD » / « GH »; null when unknown. */
export function countryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (ISO.test(trimmed.toUpperCase()) && trimmed.length === 2) return trimmed.toUpperCase();
  const folded = fold(trimmed);
  return ALIASES[folded] ?? nameIndex().get(folded) ?? null;
}

/** The flag of a country, made of the two regional letters (🇨🇩 for « CD »). */
export function flagOf(code: string) {
  if (!ISO.test(code)) return "";
  return String.fromCodePoint(...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/** « RD Congo » for « CD » (the French usage of the platform), Intl's name otherwise. */
export function countryName(code: string, locale: string = displayLocale()) {
  if (code === "CD" && locale === "fr") return "RD Congo";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * The time zone of a country, for the local time next to the city: the capital's for a country
 * with several zones. Countries not listed show no time.
 */
const ZONES: Record<string, string> = {
  CD: "Africa/Kinshasa",
  CG: "Africa/Brazzaville",
  CM: "Africa/Douala",
  GA: "Africa/Libreville",
  AO: "Africa/Luanda",
  RW: "Africa/Kigali",
  BI: "Africa/Bujumbura",
  CF: "Africa/Bangui",
  TD: "Africa/Ndjamena",
  GQ: "Africa/Malabo",
  CI: "Africa/Abidjan",
  SN: "Africa/Dakar",
  NG: "Africa/Lagos",
  GH: "Africa/Accra",
  BJ: "Africa/Porto-Novo",
  TG: "Africa/Lome",
  BF: "Africa/Ouagadougou",
  ML: "Africa/Bamako",
  NE: "Africa/Niamey",
  GN: "Africa/Conakry",
  MR: "Africa/Nouakchott",
  LR: "Africa/Monrovia",
  SL: "Africa/Freetown",
  GM: "Africa/Banjul",
  KE: "Africa/Nairobi",
  TZ: "Africa/Dar_es_Salaam",
  UG: "Africa/Kampala",
  ET: "Africa/Addis_Ababa",
  ZA: "Africa/Johannesburg",
  ZM: "Africa/Lusaka",
  ZW: "Africa/Harare",
  MZ: "Africa/Maputo",
  MG: "Indian/Antananarivo",
  MA: "Africa/Casablanca",
  DZ: "Africa/Algiers",
  TN: "Africa/Tunis",
  EG: "Africa/Cairo",
  FR: "Europe/Paris",
  BE: "Europe/Brussels",
  CH: "Europe/Zurich",
  DE: "Europe/Berlin",
  GB: "Europe/London",
  PT: "Europe/Lisbon",
  ES: "Europe/Madrid",
  IT: "Europe/Rome",
  NL: "Europe/Amsterdam",
  RU: "Europe/Moscow",
  US: "America/New_York",
  CA: "America/Toronto",
  BR: "America/Sao_Paulo",
  CN: "Asia/Shanghai",
  IN: "Asia/Kolkata",
  AE: "Asia/Dubai",
};

export function timeZoneOf(code: string): string | null {
  return ZONES[code] ?? null;
}

/**
 * The flag shown beside a language on the profile (demande d'Ephraïm du 31/10/2026): the country
 * most associated with it; the languages of the Congo (lingala, kikongo, tshiluba) take the flag
 * of the DRC. A language without a sensible country has none.
 */
const LANGUAGE_FLAGS: Record<string, string> = {
  fr: "FR",
  en: "GB",
  ln: "CD",
  kg: "CD",
  lu: "CD",
  lua: "CD",
  kmb: "AO",
  umb: "AO",
  mos: "BF",
  dyu: "CI",
  bm: "ML",
  fon: "BJ",
  ee: "TG",
  bem: "ZM",
  ny: "MW",
  sn: "ZW",
  xh: "ZA",
  ti: "ER",
  om: "ET",
  kab: "DZ",
  lg: "UG",
  ki: "KE",
  luo: "KE",
  he: "IL",
  hi: "IN",
  ko: "KR",
  tr: "TR",
  pl: "PL",
  el: "GR",
  sv: "SE",
  sw: "TZ",
  pt: "PT",
  ar: "SA",
  es: "ES",
  de: "DE",
  it: "IT",
  zh: "CN",
  ja: "JP",
  ru: "RU",
  nl: "NL",
  wo: "SN",
  yo: "NG",
  ha: "NG",
  ig: "NG",
  am: "ET",
  rw: "RW",
  rn: "BI",
  sg: "CF",
  zu: "ZA",
  af: "ZA",
  ff: "SN",
  mg: "MG",
  so: "SO",
  tw: "GH",
};

/** « 🇨🇩 » for « ln », an empty string for a language without a flag. */
export function languageFlagOf(code: string) {
  const country = LANGUAGE_FLAGS[code.trim().toLowerCase().split(/[-_]/)[0] ?? ""];
  return country ? flagOf(country) : "";
}
