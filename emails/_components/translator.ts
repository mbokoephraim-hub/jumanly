import { createTranslator } from "next-intl";
import messages from "../../messages/fr.json";
import english from "../../messages/en.json";

/** E-mails are rendered outside a Next.js request, so they read the messages directly. */
export const t = createTranslator({ locale: "fr", messages });

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type EmailLocale = "fr" | "en";

type Tree = { [key: string]: string | Tree };

/** English laid over French, as on the public site: an untranslated text stays in French. */
function overlay(base: Tree, top: Tree): Tree {
  const result: Tree = { ...base };
  for (const [key, value] of Object.entries(top)) {
    const under = base[key];
    result[key] =
      typeof value === "object" && typeof under === "object" ? overlay(under, value) : value;
  }
  return result;
}

let en: typeof t | undefined;

/** E-mails sent from the public site speak the visitor's language. */
export function translatorFor(locale: EmailLocale): typeof t {
  if (locale === "fr") return t;
  en ??= createTranslator({
    locale: "en",
    messages: overlay(messages as unknown as Tree, english as Tree) as unknown as typeof messages,
  });
  return en;
}
