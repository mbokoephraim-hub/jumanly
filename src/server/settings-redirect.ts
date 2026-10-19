import { redirect } from "next/navigation";

/**
 * An organization's member opening a talent settings page goes to the former page, at the same
 * tab and with the same answer (`ok`, `erreur`), until the recruiter redesign.
 */
export function toHireSettings(tab: string, params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams({ onglet: tab });
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && key !== "onglet") query.set(key, value);
  }
  redirect(`/app/parametres?${query}`);
}
