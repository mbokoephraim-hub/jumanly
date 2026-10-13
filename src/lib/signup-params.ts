import { isSafeInternalPath } from "./signup";

export const signupProfileValues = ["talent", "rh", "company", "partner"] as const;
export type SignupProfileValue = (typeof signupProfileValues)[number];

/** Query string of the sign-up steps: `profil`, `forfait`, `suite` (docs/specifications.md, partie 06 § 6.2). */
export function readSignupParams(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;
  const profil = one("profil");
  const suite = one("suite");
  return {
    profil: signupProfileValues.find((value) => value === profil),
    forfait: one("forfait")?.slice(0, 60),
    suite: suite && isSafeInternalPath(suite) ? suite : undefined,
  };
}

export function stepHref(
  path: string,
  params: { profil?: string; forfait?: string; suite?: string },
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
