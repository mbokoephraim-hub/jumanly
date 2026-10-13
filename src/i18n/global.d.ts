import type messages from "../../messages/fr.json";

// Clés de traduction vérifiées par TypeScript : une clé inexistante ne compile pas.
declare module "next-intl" {
  interface AppConfig {
    Locale: "fr";
    Messages: typeof messages;
  }
}
