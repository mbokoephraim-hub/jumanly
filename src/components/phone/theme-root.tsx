"use client";

import { useEffect } from "react";
import {
  LIGHT_QUERY,
  PHONE_CREAM,
  PHONE_NIGHT,
  PHONE_THEME_EVENT,
  readPhoneTheme,
  resolvePhoneTheme,
  type PhoneTheme,
} from "@/lib/phone-theme";

/**
 * Colours of the phone app (Sombre, Clair « Crème doux », or as the phone): `data-nb-theme` on
 * <html> for the screens of the Modèle B, the `sombre` class for the screens without a mockup,
 * and the browser bar in the ground of the screen. « Comme mon téléphone » follows the phone live;
 * a choice made in Paramètres applies at once. Leaving the app takes it all away.
 */
export function PhoneThemeRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(LIGHT_QUERY);
    let choice: PhoneTheme = readPhoneTheme();
    let colour = PHONE_NIGHT;
    const paintBar = () => {
      for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'))
        if (meta.content !== colour) meta.content = colour;
    };
    const apply = () => {
      const light = resolvePhoneTheme(choice) === "clair";
      root.setAttribute("data-nb-theme", light ? "clair" : "sombre");
      root.classList.toggle("sombre", !light);
      colour = light ? PHONE_CREAM : PHONE_NIGHT;
      paintBar();
    };
    const changed = (event: Event) => {
      choice = (event as CustomEvent<PhoneTheme>).detail;
      apply();
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener(PHONE_THEME_EVENT, changed);
    // On a client navigation Next writes the theme-color of the root layout again.
    const observer = new MutationObserver(paintBar);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener(PHONE_THEME_EVENT, changed);
      observer.disconnect();
      root.removeAttribute("data-nb-theme");
      root.classList.remove("sombre");
    };
  }, []);
  return null;
}
