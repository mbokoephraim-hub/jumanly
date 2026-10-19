import { redirect } from "next/navigation";

/** « Mes candidatures » now lives in Suivi (planche talent-2 § 2). */
export default async function ApplicationsPage({
  searchParams,
}: PageProps<"/app/jobs/candidatures">) {
  const query = await searchParams;
  redirect(query.onglet === "terminees" ? "/app/suivi?vue=terminees" : "/app/suivi");
}
