import { redirect } from "next/navigation";

/** The old catalog (`/app/learn/explorer`) now lives in « Rechercher » (refonte mobile, lot 5). */
export default async function LearnExploreRedirect({
  searchParams,
}: PageProps<"/app/learn/explorer">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") query.set(key, value);
  const text = query.toString();
  redirect(text ? `/app/learn/rechercher?${text}` : "/app/learn/rechercher");
}
