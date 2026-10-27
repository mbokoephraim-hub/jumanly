/** The night of the Modèle B (phone.css `--nb-nuit`): the colour of the whole phone screen. */
export const PHONE_NIGHT = "#0b1a1f";
/** The ground of the light theme « Crème doux » (phone.css, `html[data-nb-theme="clair"]`). */
export const PHONE_CREAM = "#f2ede5";

/**
 * Colours of the phone app (Ephraïm, 27/10/2026): « Sombre » (the default), « Clair » (Crème doux)
 * or « Comme mon téléphone ». Kept on this phone (localStorage), like the setting of the phone.
 */
export const PHONE_THEMES = ["sombre", "clair", "auto"] as const;
export type PhoneTheme = (typeof PHONE_THEMES)[number];
export const PHONE_THEME_KEY = "jm-theme";
/** Sent on `window` when the choice changes, so the open app follows at once. */
export const PHONE_THEME_EVENT = "jm-theme";
export const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * Before the first paint, the browser bar (and the status bar of the installed app) takes the
 * ground of the screen, so it covers the screen from top to bottom. With `follow`, the choice of
 * the person is read first: `<html data-nb-theme="clair">` and, for the screens without a mockup,
 * the `sombre` class of the dark mode; without it (sign-in pages), the night as before.
 */
export function phoneThemeScript(follow = false) {
  if (!follow)
    return `document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content","${PHONE_NIGHT}")})`;
  return `(function(){var c;try{c=localStorage.getItem("${PHONE_THEME_KEY}")}catch(e){}var l=c==="clair"||(c==="auto"&&window.matchMedia("${LIGHT_QUERY}").matches);var r=document.documentElement;r.setAttribute("data-nb-theme",l?"clair":"sombre");r.classList.toggle("sombre",!l);document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",l?"${PHONE_CREAM}":"${PHONE_NIGHT}")})})()`;
}

/** The choice kept on this phone (« Sombre » when none, or outside a browser). */
export function readPhoneTheme(): PhoneTheme {
  try {
    const value = localStorage.getItem(PHONE_THEME_KEY);
    return PHONE_THEMES.includes(value as PhoneTheme) ? (value as PhoneTheme) : "sombre";
  } catch {
    return "sombre";
  }
}

export function savePhoneTheme(theme: PhoneTheme) {
  try {
    localStorage.setItem(PHONE_THEME_KEY, theme);
  } catch {
    // Private browsing: the choice holds until the page is closed.
  }
  window.dispatchEvent(new CustomEvent(PHONE_THEME_EVENT, { detail: theme }));
}

/** The colours shown now: « Comme mon téléphone » follows the phone. */
export function resolvePhoneTheme(theme: PhoneTheme): "sombre" | "clair" {
  if (theme === "auto") return window.matchMedia(LIGHT_QUERY).matches ? "clair" : "sombre";
  return theme;
}
