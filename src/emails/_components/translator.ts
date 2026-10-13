import { createTranslator } from "next-intl";
import messages from "../../../messages/fr.json";

/** E-mails are rendered outside a Next.js request, so they read the messages directly. */
export const t = createTranslator({ locale: "fr", messages });

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
