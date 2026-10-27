import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AdminEmpty, AdminPageHeader, adminCard, adminTitle } from "@/components/admin/kit";
import { Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireAdminShell } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  adminSearch,
  normalizeQuery,
  type SearchKind,
  searchKindsFor,
} from "@/server/services/admin-search";

const kindIcon: Record<SearchKind, IconName> = {
  users: "profil",
  organizations: "entreprise",
  jobs: "jobs",
  courses: "learn",
  plans: "portefeuille",
};

/** Where « Voir tous les résultats » of a kind leads: its own list, searched. */
const kindList: Partial<Record<SearchKind, (q: string) => string>> = {
  users: (q) => `/admin/utilisateurs?q=${encodeURIComponent(q)}`,
  organizations: (q) => `/admin/organisations?q=${encodeURIComponent(q)}`,
  jobs: (q) => `/admin/offres?onglet=toutes&q=${encodeURIComponent(q)}`,
  courses: (q) => `/admin/formations?q=${encodeURIComponent(q)}`,
};

/**
 * Recherche globale (Admin v2, étape 1): accounts, organizations, jobs, courses and plans, grouped
 * by kind, limited to what the role may open. A GET form: it works without JavaScript.
 */
export default async function AdminSearch({ searchParams }: PageProps<"/admin/recherche">) {
  await connection();
  const user = await requireAdminShell();
  if (!user) notFound();
  const params = await searchParams;
  const t = await getTranslations("admin.search");
  const q = normalizeQuery(typeof params.q === "string" ? params.q : "");
  const kinds = searchKindsFor(user.platformRole);
  const results = await adminSearch(db, q, user.platformRole);
  const count = kinds.reduce((sum, kind) => sum + results[kind].length, 0);
  const editor = !["platform_admin", "support_agent"].includes(user.platformRole);

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <form
        action="/admin/recherche"
        role="search"
        className={cx(adminCard, "flex flex-col gap-3 sm:flex-row sm:items-end")}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="admin-search-page" className="text-[13px] font-semibold">
            {t(editor ? "labelEditor" : "label")}
          </label>
          <div className="relative">
            <Icon
              name="recherche"
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
            />
            <input
              id="admin-search-page"
              name="q"
              type="search"
              defaultValue={q}
              minLength={2}
              maxLength={120}
              placeholder={t("placeholder")}
              aria-describedby="admin-search-hint"
              className="h-12 w-full rounded-pill bg-creme pr-4 pl-11 text-[14px] text-sapin ring-[1.5px] ring-brume ring-inset placeholder:text-ardoise focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:ring-sapin focus:outline-none"
            />
          </div>
          <p id="admin-search-hint" className="text-[11.5px] text-ardoise">
            {t("hint")}
          </p>
        </div>
        <Button type="submit" className="sm:mb-[22px]">
          {t("submit")}
        </Button>
      </form>

      {q.length >= 2 && (
        <p className="text-[13px] text-ardoise" aria-live="polite">
          {t("results", { count, q })}
        </p>
      )}

      {q.length >= 2 && count === 0 && (
        <AdminEmpty title={t("empty.title")} text={t("empty.text")} />
      )}

      {count > 0 && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {kinds
            .filter((kind) => results[kind].length > 0)
            .map((kind) => {
              const list = kindList[kind];
              return (
                <section
                  key={kind}
                  aria-labelledby={`admin-search-${kind}`}
                  className={cx(adminCard, "flex flex-col gap-3")}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="grid size-8 place-items-center rounded-[10px] bg-neon/70"
                    >
                      <Icon name={kindIcon[kind]} className="size-4" />
                    </span>
                    <h2
                      id={`admin-search-${kind}`}
                      className={cx(adminTitle, "flex-1 !text-[16px] !leading-[22px]")}
                    >
                      {t(`kind.${kind}`)}
                    </h2>
                    <span className="text-[12px] font-semibold text-ardoise">
                      {results[kind].length}
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {results[kind].map((hit) => (
                      <li key={hit.id} className="border-b border-brume last:border-b-0">
                        <Link
                          href={hit.href}
                          className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-creme focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none"
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[13.5px] font-semibold">
                              {hit.title}
                            </span>
                            {hit.detail && (
                              <span className="truncate text-[12px] text-ardoise">
                                {hit.detail}
                              </span>
                            )}
                          </span>
                          <Icon name="chev-r" aria-hidden className="size-4 shrink-0" />
                          <span className="sr-only">{t("open")}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {list && (
                    <Link
                      href={list(q)}
                      className="self-start text-[12.5px] font-semibold underline underline-offset-2"
                    >
                      {t("more")}
                    </Link>
                  )}
                </section>
              );
            })}
        </div>
      )}
    </>
  );
}
