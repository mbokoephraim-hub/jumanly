import { PHONE_CREAM, PHONE_NIGHT } from "@/lib/phone-theme";

/**
 * The dark mode of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3): the value
 * `data-theme` on `<html>`, kept on the account (`User.appearance`, « Mode sombre » in the profile
 * menu). The screens not redrawn yet follow with the colours of the Modèle B (`data-nb-theme`).
 */
export function hireThemeScript(dark: boolean) {
  return `(function(){var r=document.documentElement;${
    dark ? 'r.setAttribute("data-theme","dark");' : 'r.removeAttribute("data-theme");'
  }})()`;
}

export function applyHireTheme(dark: boolean) {
  const root = document.documentElement;
  if (dark) root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  root.setAttribute("data-nb-theme", dark ? "sombre" : "clair");
  root.classList.toggle("sombre", dark);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", dark ? PHONE_NIGHT : PHONE_CREAM));
}
