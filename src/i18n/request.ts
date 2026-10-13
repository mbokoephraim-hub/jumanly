import { getRequestConfig } from "next-intl/server";
import messages from "../../messages/fr.json";

/** Single locale for now: French. Messages are generated from `textes/`. */
export const defaultLocale = "fr";

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages,
  timeZone: process.env.DEFAULT_TIME_ZONE ?? "UTC",
}));
