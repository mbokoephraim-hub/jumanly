import { redirect } from "next/navigation";
import { isPhone } from "@/server/view";
import CandidatesPage from "../candidats/page";

/**
 * The talent search lives in Candidats › Rechercher des talents since the recruiter redesign
 * (lot 4). Old addresses (bookmarks, e-mails) keep working: their filters are carried over. On a
 * phone (Modèle B) it is the first screen of the Talents tab.
 */
export default async function TalentsRedirect({ searchParams }: PageProps<"/app/hire/talents">) {
  const query = await searchParams;
  // On a phone, Talents is a tab of its own (Modèle B, lot M1).
  if (await isPhone())
    return (
      <CandidatesPage
        params={Promise.resolve({})}
        searchParams={Promise.resolve({ ...query, vue: "talents" })}
      />
    );
  const next = new URLSearchParams({ vue: "talents" });
  const carry: Record<string, string> = {
    q: "q",
    location: "lieu",
    lieu: "lieu",
    job: "offre",
    offre: "offre",
    competences: "competences",
  };
  for (const [from, to] of Object.entries(carry)) {
    const value = query[from];
    if (typeof value === "string" && value) next.set(to, value.slice(0, 320));
  }
  redirect(`/app/hire/candidats?${next}`);
}
