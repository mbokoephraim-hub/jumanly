import { getRequestConfig } from "next-intl/server";
import type { Messages } from "next-intl";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";

/** French is the reference. Messages are generated from `textes/` (`pnpm messages`). */
export const defaultLocale = "fr";

type Tree = { [key: string]: string | Tree };

/** English laid over French: a text not yet translated keeps its French version. */
function overlay(base: Tree, top: Tree): Tree {
  const result: Tree = { ...base };
  for (const [key, value] of Object.entries(top)) {
    const under = base[key];
    result[key] =
      typeof value === "object" && typeof under === "object" ? overlay(under, value) : value;
  }
  return result;
}

const english = overlay(fr as Tree, en as Tree) as unknown as Messages;

// The locale is the one set by a public page (`applySiteLocale`); everywhere else, French.
export default getRequestConfig(async ({ locale: requested }) => {
  const locale = requested === "en" ? "en" : "fr";
  return {
    locale,
    messages: locale === "en" ? english : fr,
    timeZone: process.env.DEFAULT_TIME_ZONE ?? "UTC",
  };
});
