/** The two talent interfaces (src/server/view.ts): Modèle B under 768 px, the web one above. */
export type View = "phone" | "wide";

export const VIEW_COOKIE = "jm_vue";
export const PHONE_QUERY = "(max-width: 767px)";
export const PHONE_AGENT = /Mobi|iPhone|iPod/i;
