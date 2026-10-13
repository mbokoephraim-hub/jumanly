import { getRequestConfig } from "next-intl/server";
import messages from "../../messages/fr.json";

/** Langue unique pour l'instant : le français. Les messages sont générés depuis `textes/`. */
export const langueParDefaut = "fr";

export default getRequestConfig(async () => ({
  locale: langueParDefaut,
  messages,
  timeZone: process.env.NEXT_PUBLIC_FUSEAU_HORAIRE ?? "UTC",
}));
