import { redirect } from "next/navigation";

/** A pool now opens inside the pools page (mockup 04-07); old links keep working. */
export default async function PoolPage({
  params,
  searchParams,
}: PageProps<"/app/hire/viviers/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const next = new URLSearchParams({ vivier: id });
  for (const key of ["ok", "erreur"] as const) {
    const value = query[key];
    if (typeof value === "string") next.set(key, value);
  }
  redirect(`/app/hire/viviers?${next}#vivier`);
}
