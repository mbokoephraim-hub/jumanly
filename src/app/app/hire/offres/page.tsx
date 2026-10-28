import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { OfferCard, OfferSheets, OrbiLine } from "@/components/recruiter/offers";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { db } from "@/server/db";
import { can, limit, resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { activeCount, listOffers, offerTabs, type OfferTab } from "@/server/services/hire-offers";
import { orgStructure } from "@/server/services/org-structure";
import { isPhone } from "@/server/view";
import { RhNewOffer, RhTab } from "@/components/phone/recruteur/head";
import { RH_OFFER_FILTERS, RhOffersList, rhOffersLine } from "@/components/phone/recruteur/offres";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.list");
  return { title: t("seo"), robots: { index: false } };
}

const FILTERS = ["responsable", "equipe", "departement", "entite"] as const;
const OK_TOASTS = ["brouillon", "pause", "reprise", "fermee", "supprimee"] as const;

/**
 * Mes offres (brief recruteur § 2.4, planches recruteur-1 r2 and r1plus): the search and its
 * filters, « Créer une offre », the five tabs with their counts, then one card per offer with its
 * colour and its real figures. The « … » of each card opens its actions.
 */
async function HireOffersPageContent({ searchParams }: PageProps<"/app/hire/offres">) {
  const params = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/offres");
  const t = await getTranslations("hireOffers");
  const tw = await getTranslations("hireWeb.offers");
  const tats = await getTranslations("hireWeb.ats");
  const now = new Date();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const permissions = hirePermissions(ctx.role);
  const [offers, teams, entities, max, plan] = await Promise.all([
    listOffers(db, ctx, now),
    can(db, subject, "org.teams"),
    can(db, subject, "org.entities"),
    limit(db, subject, "jobs.active.max"),
    resolvePlan(db, subject),
  ]);
  const structure = teams ? await orgStructure(db, ctx.organizationId) : null;
  const param = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const query = param("q").trim().slice(0, 80);
  const tab: OfferTab = offerTabs.includes(param("onglet") as OfferTab)
    ? (param("onglet") as OfferTab)
    : param("onglet") === "fermees"
      ? "cloturees"
      : "actives";
  const filtered = offers.filter(
    (job) =>
      (!param("responsable") || job.assignedToId === param("responsable")) &&
      (!param("equipe") || job.teamId === param("equipe")) &&
      (!param("departement") || job.departmentId === param("departement")) &&
      (!param("entite") || job.entityId === param("entite")) &&
      (!query || job.title.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))),
  );
  const inTab = (id: OfferTab) => filtered.filter((job) => job.tab === id);
  const shown = inTab(tab);
  const hrefWith = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const key of ["onglet", "q", ...FILTERS]) {
      const value = key in changes ? changes[key]! : param(key);
      if (value) next.set(key, value);
    }
    const text = next.toString();
    return text ? `/app/hire/offres?${text}` : "/app/hire/offres";
  };
  const back = hrefWith({});
  const owners = new Map(
    offers.flatMap((job) =>
      job.assignedToId && job.assignedTo ? [[job.assignedToId, job.assignedTo.name]] : [],
    ),
  );
  const filters = structure
    ? [
        {
          key: "responsable",
          label: t("list.filterOwner"),
          options: [...owners].map(([value, label]) => ({ value, label })),
        },
        {
          key: "equipe",
          label: t("list.filterTeam"),
          options: structure.teams.map((item) => ({ value: item.id, label: item.name })),
        },
        {
          key: "departement",
          label: t("list.filterDepartment"),
          options: structure.departments.map((item) => ({ value: item.id, label: item.name })),
        },
        ...(entities
          ? [
              {
                key: "entite",
                label: t("list.filterEntity"),
                options: structure.entities.map((item) => ({ value: item.id, label: item.name })),
              },
            ]
          : []),
      ]
    : [];
  const activeFilters = FILTERS.filter((key) => param(key)).length;
  const ok = OK_TOASTS.find((value) => value === param("ok"));
  const limited = param("limite") || param("erreur") === "limite";

  // On a computer or a tablet (planche web recruteur-1 § 2): the title, the active offers against
  // the limit of the plan, and « Créer une offre » on the right.
  const count = activeCount(offers);
  const line =
    max < 0 ? tw("activeUnlimited", { count }) : tw("active", { count, max: String(max) });

  return (
    <div className="t-flux t-large t-rw-offres">
      <div className="t-rw-h">
        <div className="t-t">
          <h1 className="max-md:sr-only">{t("list.title")}</h1>
          <p className="t-web">
            {plan?.planName ? tw("plan", { line, plan: plan.planName }) : line}
          </p>
        </div>
        {permissions.manage && (
          <Link href="/app/hire/offres/nouvelle" className="t-bt t-a t-m t-press t-web">
            <TalentIcon name="plus" size="s" />
            {t("list.create")}
          </Link>
        )}
      </div>
      {ok && <ToastOnLoad message={t(`list.ok.${ok}`)} tone="success" />}
      {limited && <Notice tone="err">{t("list.limit")}</Notice>}

      <div className="t-rw-flt">
        <form method="get" role="search" className="t-rech t-verre">
          {tab !== "actives" && <input type="hidden" name="onglet" value={tab} />}
          {FILTERS.map((key) =>
            param(key) ? <input key={key} type="hidden" name={key} value={param(key)} /> : null,
          )}
          <TalentIcon name="recherche" size="s" />
          <input
            id="rx-offres-q"
            name="q"
            type="search"
            defaultValue={query}
            aria-label={t("list.search")}
            placeholder={t("list.search")}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-(--texte) outline-none"
          />
          {filters.length > 0 && (
            <SheetButton
              target="rx-offres-filtres"
              className="t-f t-press"
              label={t("list.filtersCount", { count: activeFilters })}
            >
              <TalentIcon name="filtres" size="s" />
              {activeFilters > 0 && <b aria-hidden>{activeFilters}</b>}
            </SheetButton>
          )}
        </form>

        {permissions.manage && (
          <Link href="/app/hire/offres/nouvelle" className="t-bt t-a t-rx-pub t-press t-mob">
            <TalentIcon name="plus" size="s" />
            {t("list.create")}
          </Link>
        )}

        <nav aria-label={t("list.tabs")} className="t-rx-onglets">
          {offerTabs.map((id) => {
            const count = inTab(id).length;
            return (
              <Link
                key={id}
                href={hrefWith({ onglet: id === "actives" ? "" : id })}
                aria-current={id === tab ? "page" : undefined}
                className="t-puce t-press"
              >
                {t(`list.tab.${id}`)}
                {count > 0 && <small>{count}</small>}
              </Link>
            );
          })}
        </nav>
      </div>

      {shown.length === 0 ? (
        <p className="t-verre t-rx-vide">
          <span>{query ? t("list.emptySearch", { query }) : t(`list.empty.${tab}`)}</span>
        </p>
      ) : (
        <div className="t-flux t-serre t-rw-grille">
          {shown.map((job) => (
            <OfferCard
              key={job.id}
              job={job}
              org={space.organization.name}
              now={now}
              manage={permissions.manage}
              readApplications={permissions.readApplications}
              back={back}
            />
          ))}
        </div>
      )}
      {/* Web recruiter lot 4 (planche « Arriver à l'ATS »): what « Analyser (ATS) » does. */}
      {permissions.readApplications && shown.some((job) => job.figures.applications > 0) && (
        <div className="t-rw-web t-rw-atsl">
          <OrbiLine>
            <b>{tats("atsLineLead")}</b> {tats("atsLine")}
          </OrbiLine>
        </div>
      )}
      {shown.map((job) => (
        <OfferSheets
          key={job.id}
          job={job}
          back={back}
          manage={permissions.manage}
          readApplications={permissions.readApplications}
        />
      ))}

      {filters.length > 0 && (
        <Sheet id="rx-offres-filtres" title={t("list.filters")} closeLabel={t("menu.closeSheet")}>
          <form method="get" className="t-rx-filtres">
            {tab !== "actives" && <input type="hidden" name="onglet" value={tab} />}
            {query && <input type="hidden" name="q" value={query} />}
            {filters.map((filter) => (
              <div key={filter.key} className="t-champ">
                <label htmlFor={`rx-f-${filter.key}`}>{filter.label}</label>
                <div className="t-verre t-saisie">
                  <select
                    id={`rx-f-${filter.key}`}
                    name={filter.key}
                    defaultValue={param(filter.key)}
                  >
                    <option value="">{t("list.filterAll")}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <div className="t-rx-feuille-bts">
              <Link
                href={hrefWith(Object.fromEntries(FILTERS.map((key) => [key, ""])))}
                className="t-bt t-sec t-m t-press"
              >
                {t("list.filtersReset")}
              </Link>
              <button type="submit" className="t-bt t-p t-press">
                {t("list.filtersApply")}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}

/**
 * On a phone, the Offres tab of Modèle B (docs/modele-b-recruteur, lot M4, planches
 * Recruteur-offres and -offres-encours): the line of figures, « Toutes · En cours · Terminées »
 * and one card per offer.
 */
async function PhoneOffers({ searchParams }: PageProps<"/app/hire/offres">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/hire/offres");
  const t = await getTranslations("hireOffers");
  const now = new Date();
  const offers = await listOffers(db, ctx, now);
  const filter = RH_OFFER_FILTERS.find((key) => key === params.vue) ?? "toutes";
  const ok = OK_TOASTS.find((value) => value === params.ok);
  return (
    <RhTab
      tab="offres"
      subtitle={await rhOffersLine(offers)}
      actions={hirePermissions(ctx.role).manage ? <RhNewOffer /> : null}
      legacy={false}
    >
      {ok && <ToastOnLoad message={t(`list.ok.${ok}`)} tone="success" />}
      {params.limite || params.erreur === "limite" ? (
        <p className="nb-erreur nb-rh-marge" role="alert">
          {t("list.limit")}
        </p>
      ) : null}
      <RhOffersList offers={offers} filter={filter} now={now} />
    </RhTab>
  );
}

export default async function HireOffersPage(props: PageProps<"/app/hire/offres">) {
  if (await isPhone()) return <PhoneOffers {...props} />;
  return <HireOffersPageContent {...props} />;
}
