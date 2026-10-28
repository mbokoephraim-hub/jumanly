/** Choices of the administrator's sign-up shared by the page and its form (étape 3 A1). */
export const SIGNUP_SECTORS = ["fintech", "banque", "telecom", "energie", "ong"] as const;
export const SIGNUP_SIZES = ["s", "m", "l", "xl"] as const;

/** The four Modèle B banners chosen when no image is uploaded (`Organization.bannerTheme`). */
export const BANNER_THEMES = ["sapin", "nuit", "lime", "creme"] as const;
export type BannerThemeName = (typeof BANNER_THEMES)[number];
export const BANNER_GRADIENTS: Record<BannerThemeName, string> = {
  sapin: "linear-gradient(120deg, #14745F 0%, #0B1A1F 100%)",
  nuit: "linear-gradient(120deg, #1E4E79 0%, #0B1A1F 100%)",
  lime: "linear-gradient(120deg, #A6F26B 0%, #14745F 100%)",
  creme: "linear-gradient(120deg, #F2EDE5 0%, #9FE8D2 100%)",
};

/** The banner's background: the uploaded image, else the chosen colour (sapin by default). */
export function bannerBackground(banner: string | null, theme: string | null) {
  if (banner) return `url(${banner})`;
  return BANNER_GRADIENTS[
    (BANNER_THEMES as readonly string[]).includes(theme ?? "")
      ? (theme as BannerThemeName)
      : "sapin"
  ];
}
