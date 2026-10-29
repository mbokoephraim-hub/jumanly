/**
 * Links to sign-up (docs/specifications.md, partie 06 § 6.2): `profil` and `forfait` pre-fill
 * steps 1 and 2, `suite` brings the visitor back to the interrupted action.
 */
export type SignupProfile = "talent" | "rh" | "company" | "partner";

/** Only internal paths are accepted as `suite` (no open redirect). */
export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export function signupHref(
  options: { profil?: SignupProfile; forfait?: string; suite?: string } = {},
) {
  const params = new URLSearchParams();
  if (options.profil) params.set("profil", options.profil);
  if (options.forfait) params.set("forfait", options.forfait);
  if (options.suite && isSafeInternalPath(options.suite)) params.set("suite", options.suite);
  const query = params.toString();
  return query ? `/inscription?${query}` : "/inscription";
}

export function loginHref(suite?: string) {
  return suite && isSafeInternalPath(suite)
    ? `/connexion?${new URLSearchParams({ suite })}`
    : "/connexion";
}

/**
 * Public sign-up opens with `NEXT_PUBLIC_SIGNUP_OPEN=1`. Until then the public site leads every
 * « Créer un compte » to the waitlist; /inscription and /connexion keep working for direct links.
 */
export const signupOpen = process.env.NEXT_PUBLIC_SIGNUP_OPEN === "1";

const waitlistProfiles: Record<SignupProfile, string> = {
  talent: "talent",
  rh: "recruteur",
  company: "entreprise",
  partner: "partenaire",
};

/** Where the public site's sign-up buttons lead: sign-up when it is open, the waitlist otherwise. */
export function joinHref(options: Parameters<typeof signupHref>[0] = {}) {
  if (signupOpen) return signupHref(options);
  return options.profil
    ? `/liste-attente?${new URLSearchParams({ profil: waitlistProfiles[options.profil] })}`
    : "/liste-attente";
}

/** « Se connecter pour voir… » on the public site: sign-in when sign-up is open, the waitlist otherwise. */
export function memberHref(suite?: string) {
  return signupOpen ? loginHref(suite) : joinHref({ profil: "talent" });
}
