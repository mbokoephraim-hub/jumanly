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
