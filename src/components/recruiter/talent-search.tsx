import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { moreTalentsAction } from "@/server/actions/hire-talents";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { allowAttempt } from "@/server/rate-limit";
import type { HireContext } from "@/server/services/hire";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";
import {
  experienceLevels,
  orgProposals,
  proposalFilterOf,
  proposalFilters,
  searchQuotas,
  searchTalents,
  skillList,
  type TalentResult,
} from "@/server/services/talent-search";
import { avatarTone, initialsOf } from "./candidates";
import { TalentList, type TalentCard } from "./talent-list";

type T = Awaited<ReturnType<typeof getTranslations<"hireTalents">>>;

/** The cards of « Découvrir »: what the talent made visible, never an excluded datum. */
export function talentCards(results: TalentResult[], t: T, jobId: string): TalentCard[] {
  return results.map((talent) => {
    const title = talent.anonymous
      ? t("list.anonymous", { headline: talent.headline || t("list.noHeadline") })
      : (talent.name ?? "");
    return {
      profileId: talent.profileId,
      title,
      initials: talent.anonymous ? "?" : initialsOf(title),
      tone: avatarTone(talent.profileId),
      line: [
        talent.anonymous ? null : talent.headline,
        talent.city,
        t(
          `availability.${talent.availability === "not_looking" ? "notLooking" : talent.availability}`,
        ),
      ]
        .filter(Boolean)
        .join(" · "),
      score: talent.score,
      skills: talent.skills.slice(0, 2),
      href: `/app/hire/talents/${talent.profileId}${jobId ? `?offre=${jobId}` : ""}`,
    };
  });
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.slice(0, 320) : "";

/** « Découvrir » and « Mes propositions » (planche r2plus `sub-t`). */
async function SubTabs({ current, count }: { current: "talents" | "propositions"; count: number }) {
  const t = await getTranslations("hireTalents.tabs");
  return (
    <nav className="t-ri-sub" aria-label={t("aria")}>
      <Link
        href="/app/hire/candidats?vue=talents"
        aria-current={current === "talents" ? "page" : undefined}
        className="t-press"
      >
        {t("discover")}
      </Link>
      <Link
        href="/app/hire/candidats?vue=propositions"
        aria-current={current === "propositions" ? "page" : undefined}
        className="t-press"
      >
        {t("proposals")}
        {count > 0 && <small>{count}</small>}
      </Link>
    </nav>
  );
}

/**
 * Candidats › Rechercher des talents › Découvrir (brief recruteur § 4 item 4, planches r2plus TAL
 * and TAL_F): only the talents who made their profile visible, compared with one of the offers.
 * The filters never touch age, gender, nationality or photo. Each new search uses one search of
 * the month (`hire.talent_search.monthly`); the next profiles of the same search do not.
 */
export async function TalentSearchView({
  ctx,
  query,
  segments,
}: {
  ctx: HireContext;
  query: Record<string, string | string[] | undefined>;
  segments: React.ReactNode;
}) {
  const t = await getTranslations("hireTalents");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [searchLevel, plans, offers, proposals, messages] = await Promise.all([
    level(db, subject, "hire.talent_search"),
    listPublicPlans(db),
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        city: true,
        skills: {
          orderBy: { importance: "asc" },
          select: { importance: true, skill: { select: { name: true } } },
        },
      },
    }),
    db.contactRequest.count({ where: { organizationId: ctx.organizationId } }),
    getMessages(),
  ]);
  const deepPlan = cheapestPlanWhere(
    plans,
    ["rh", "company"],
    (plan) => levelOf(plan, "hire.talent_search") === "deep",
  );

  if (searchLevel === "none") {
    const plan = cheapestPlanWhere(
      plans,
      ["rh", "company"],
      (item) => levelOf(item, "hire.talent_search") !== "none",
    );
    return (
      <div className="t-flux">
        <h1 className="sr-only">{t("title")}</h1>
        {segments}
        <div className="t-rc-orbi">
          <div className="t-rc-lock">
            <b>
              <OrbiMark size={22} />
              {t("locked.title")}
            </b>
            <span>{plan ? t("locked.text", { plan: plan.name }) : t("locked.noPlan")}</span>
            <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
              {t("locked.cta")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deep = searchLevel === "deep";
  // The offer the profiles are compared with: the one chosen, else the newest published offer.
  const asked = one(query.offre);
  const offer =
    asked === "aucune" ? null : (offers.find((item) => item.id === asked) ?? offers[0] ?? null);
  const filters = {
    q: one(query.q).trim(),
    skills: skillList(one(query.competences)),
    location: one(query.lieu).trim().slice(0, 80),
    level: (deep && experienceLevels.find((value) => value === one(query.experience))) || null,
    availability: deep
      ? (["open", "listening"].find((value) => value === one(query.dispo)) ?? "")
      : "",
    remote: deep && one(query.distance) === "1" ? "remote" : "",
  };
  const raw = {
    q: filters.q,
    skills: filters.skills.join(","),
    location: filters.location,
    job: offer?.id ?? "",
    level: filters.level ?? "",
    availability: filters.availability,
    remote: filters.remote,
  };
  const askedSearch = Boolean(raw.q || raw.skills || raw.location || raw.job);
  const allowed = !askedSearch || (await allowAttempt("talentSearch", ctx.userId));
  const [result, quotas] = await Promise.all([
    allowed ? searchTalents(db, ctx, raw) : ({ status: "rateLimited" } as const),
    searchQuotas(db, ctx.organizationId),
  ]);

  const href = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams({ vue: "talents" });
    const state: Record<string, string | null> = {
      offre: asked || null,
      q: filters.q || null,
      competences: filters.skills.join(",") || null,
      lieu: filters.location || null,
      experience: filters.level || null,
      dispo: filters.availability || null,
      distance: filters.remote ? "1" : null,
      ...changes,
    };
    for (const [key, value] of Object.entries(state)) if (value) next.set(key, value);
    return `/app/hire/candidats?${next}`;
  };
  const chips = [
    ...filters.skills.map((skill) => ({
      label: skill,
      href: href({
        competences: filters.skills.filter((item) => item !== skill).join(",") || null,
      }),
    })),
    ...(filters.location ? [{ label: filters.location, href: href({ lieu: null }) }] : []),
    ...(filters.remote ? [{ label: t("filters.remote"), href: href({ distance: null }) }] : []),
    ...(filters.level
      ? [{ label: t(`filters.level.${filters.level}`), href: href({ experience: null }) }]
      : []),
    ...(filters.availability
      ? [
          {
            label: t(`filters.availability.${filters.availability as "open"}`),
            href: href({ dispo: null }),
          },
        ]
      : []),
  ];
  const active = chips.length;
  const suggestedSkills = [
    ...new Set([...(offer?.skills.map((item) => item.skill.name) ?? []), ...filters.skills]),
  ].slice(0, 8);
  const places = [...new Set([offer?.city, filters.location].filter(Boolean) as string[])];
  const searchesLeft =
    quotas.searches.limit < 0 ? null : { used: quotas.searches.used, max: quotas.searches.limit };
  const cards = result.status === "ok" ? talentCards(result.results, t, offer?.id ?? "") : [];

  return (
    <div className="t-flux t-ri-talents">
      <h1 className="sr-only">{t("title")}</h1>
      {segments}
      <SubTabs current="talents" count={proposals} />

      <form action="/app/hire/candidats" className="t-verre t-ri-rech" role="search">
        <input type="hidden" name="vue" value="talents" />
        {asked && <input type="hidden" name="offre" value={asked} />}
        {filters.skills.length > 0 && (
          <input type="hidden" name="competences" value={filters.skills.join(",")} />
        )}
        {filters.location && <input type="hidden" name="lieu" value={filters.location} />}
        {filters.level && <input type="hidden" name="experience" value={filters.level} />}
        {filters.availability && <input type="hidden" name="dispo" value={filters.availability} />}
        {filters.remote && <input type="hidden" name="distance" value="1" />}
        <TalentIcon name="recherche" size="s" />
        <label htmlFor="ri-q" className="sr-only">
          {t("search.label")}
        </label>
        <input
          id="ri-q"
          name="q"
          type="search"
          defaultValue={filters.q}
          maxLength={100}
          placeholder={t("search.placeholder")}
          enterKeyHint="search"
        />
        <SheetButton
          target="ri-filtres"
          label={active ? t("filters.openActive", { count: active }) : t("filters.open")}
          className="t-ri-f t-press"
        >
          <TalentIcon name="filtres" size="s" />
          {active > 0 && <b aria-hidden>{active}</b>}
        </SheetButton>
      </form>

      {chips.length > 0 && (
        <ul className="t-ri-chips" aria-label={t("filters.active")}>
          {chips.map((chip) => (
            <li key={chip.label}>
              <Link
                href={chip.href}
                className="t-puce t-on t-press"
                aria-label={t("filters.remove", { filter: chip.label })}
              >
                {chip.label}
                <TalentIcon name="fermer" size="xs" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.status === "ok" && (
        <p className="t-ri-n">
          {offer
            ? t.rich("count.withOffer", {
                count: result.total,
                title: offer.title,
                b: (chunks) => <b>{chunks}</b>,
              })
            : t("count.plain", { count: result.total })}{" "}
          {offers.length > 0 && (
            <SheetButton target="ri-offre" className="t-ri-lien t-press">
              {t("offer.change")}
            </SheetButton>
          )}
        </p>
      )}

      {result.status === "quota" ? (
        <p className="t-gar t-err" role="alert">
          <TalentIcon name="horloge" size="s" />
          <span>{t("quota", { date: formatDayMonth(result.resetsAt) })}</span>
        </p>
      ) : result.status === "rateLimited" ? (
        <p className="t-gar t-err" role="alert">
          <TalentIcon name="horloge" size="s" />
          <span>{t("rateLimited")}</span>
        </p>
      ) : result.status === "empty" ? (
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="recherche" />
          </span>
          <b>{t("empty.title")}</b>
          <span>{t("empty.text")}</span>
        </div>
      ) : result.status === "ok" && cards.length === 0 ? (
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="candidats" />
          </span>
          <b>{t("none.title")}</b>
          <span>{t("none.text")}</span>
          {active > 0 && (
            <Link
              href={href({
                competences: null,
                lieu: null,
                experience: null,
                dispo: null,
                distance: null,
              })}
              className="t-bt t-sec t-s t-press"
            >
              {t("filters.clear")}
            </Link>
          )}
        </div>
      ) : result.status === "ok" ? (
        <NextIntlClientProvider messages={pickMessages(messages, ["hireTalents"])}>
          <TalentList
            key={JSON.stringify(raw)}
            initial={cards}
            more={result.page < result.pages}
            load={moreTalentsAction.bind(null, raw)}
          />
        </NextIntlClientProvider>
      ) : null}

      <Sheet id="ri-filtres" title={t("filters.title")} closeLabel={t("filters.close")}>
        <form action="/app/hire/candidats" className="t-ri-ff">
          <input type="hidden" name="vue" value="talents" />
          {asked && <input type="hidden" name="offre" value={asked} />}
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          <fieldset>
            <legend>{t("filters.skills")}</legend>
            <div className="t-puces">
              {suggestedSkills.map((skill) => (
                <label key={skill} className="t-puce t-rc-ch">
                  <input
                    type="checkbox"
                    name="competences"
                    value={skill}
                    defaultChecked={filters.skills.includes(skill)}
                  />
                  {skill}
                </label>
              ))}
            </div>
            <div className="t-verre t-saisie">
              <label htmlFor="ri-competence" className="sr-only">
                {t("filters.addSkill")}
              </label>
              <input
                id="ri-competence"
                name="competences"
                maxLength={60}
                placeholder={t("filters.addSkill")}
              />
            </div>
          </fieldset>
          <fieldset>
            <legend>{t("filters.place")}</legend>
            <div className="t-puces">
              {places.map((place) => (
                <label key={place} className="t-puce t-rc-ch">
                  <input
                    type="radio"
                    name="lieu"
                    value={place}
                    defaultChecked={filters.location === place}
                  />
                  {place}
                </label>
              ))}
              <label className="t-puce t-rc-ch">
                <input type="radio" name="lieu" value="" defaultChecked={!filters.location} />
                {t("filters.anywhere")}
              </label>
              <label className={cx("t-puce t-rc-ch", !deep && "t-ri-off")}>
                <input
                  type="checkbox"
                  name="distance"
                  value="1"
                  disabled={!deep}
                  defaultChecked={Boolean(filters.remote)}
                />
                {t("filters.remote")}
              </label>
            </div>
          </fieldset>
          <fieldset disabled={!deep}>
            <legend>{t("filters.experience")}</legend>
            <div className="t-puces">
              {experienceLevels.map((value) => (
                <label key={value} className={cx("t-puce t-rc-ch", !deep && "t-ri-off")}>
                  <input
                    type="radio"
                    name="experience"
                    value={value}
                    defaultChecked={filters.level === value}
                  />
                  {t(`filters.level.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={!deep}>
            <legend>{t("filters.availabilityTitle")}</legend>
            <div className="t-puces">
              {(["open", "listening"] as const).map((value) => (
                <label key={value} className={cx("t-puce t-rc-ch", !deep && "t-ri-off")}>
                  <input
                    type="radio"
                    name="dispo"
                    value={value}
                    defaultChecked={filters.availability === value}
                  />
                  {t(`filters.availability.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>
          {!deep && deepPlan && (
            <p className="t-rc-note">{t("filters.deepLocked", { plan: deepPlan.name })}</p>
          )}
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("filters.guard")}</span>
          </p>
          {searchesLeft && <p className="t-rc-note">{t("filters.quota", searchesLeft)}</p>}
          <div className="t-rx-feuille-bts">
            <Link
              href={href({
                competences: null,
                lieu: null,
                experience: null,
                dispo: null,
                distance: null,
              })}
              className="t-bt t-sec t-m t-press"
            >
              {t("filters.clear")}
            </Link>
            <button type="submit" className="t-bt t-p t-m t-pl t-press">
              {t("filters.submit")}
            </button>
          </div>
        </form>
      </Sheet>

      {offers.length > 0 && (
        <Sheet id="ri-offre" title={t("offer.title")} closeLabel={t("offer.close")}>
          <ul className="t-rc-offres">
            {offers.map((item) => (
              <li key={item.id}>
                <Link
                  href={href({ offre: item.id })}
                  aria-current={item.id === offer?.id ? "page" : undefined}
                  className="t-press"
                >
                  <span className="t-t">
                    <b>{item.title}</b>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={href({ offre: "aucune" })}
                aria-current={!offer ? "page" : undefined}
                className="t-press"
              >
                <span className="t-t">
                  <b>{t("offer.none")}</b>
                </span>
              </Link>
            </li>
          </ul>
        </Sheet>
      )}
    </div>
  );
}

/**
 * Candidats › Rechercher des talents › Mes propositions (planche r2plus PROPS): every offer
 * proposed to a talent, with their answer; « Écrire » once accepted. The talent decided each time.
 */
export async function ProposalsView({
  ctx,
  query,
  segments,
}: {
  ctx: HireContext;
  query: Record<string, string | string[] | undefined>;
  segments: React.ReactNode;
}) {
  const t = await getTranslations("hireTalents");
  const now = new Date();
  const [rows, quotas] = await Promise.all([
    orgProposals(db, ctx, now),
    searchQuotas(db, ctx.organizationId, now),
  ]);
  const filter = proposalFilters.find((value) => value === one(query.statut)) ?? null;
  const shown = filter ? rows.filter((row) => proposalFilterOf(row.status) === filter) : rows;
  const count = (value: (typeof proposalFilters)[number]) =>
    rows.filter((row) => proposalFilterOf(row.status) === value).length;
  const DAY = 86_400_000;
  const when = (date: Date) => {
    const days = Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY));
    return days < 7 ? t("proposals.sentAgo", { days }) : formatDayMonth(date);
  };
  const tag = { accepted: "t-ok", pending: "t-at", declined: "t-nr", expired: "t-nr" } as const;
  const contacts = quotas.contacts;

  return (
    <div className="t-flux t-ri-talents">
      <h1 className="sr-only">{t("proposals.title")}</h1>
      {segments}
      <SubTabs current="propositions" count={rows.length} />
      <nav className="t-rx-onglets" aria-label={t("proposals.filters")}>
        <Link
          href="/app/hire/candidats?vue=propositions"
          aria-current={filter ? undefined : "page"}
          className="t-puce t-press"
        >
          {t("proposals.all")}
          <small>{rows.length}</small>
        </Link>
        {proposalFilters.map((value) => (
          <Link
            key={value}
            href={`/app/hire/candidats?vue=propositions&statut=${value}`}
            aria-current={filter === value ? "page" : undefined}
            className="t-puce t-press"
          >
            {t(`proposals.filter.${value}`)}
            <small>{count(value)}</small>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="envoyer" />
          </span>
          <b>{t("proposals.empty")}</b>
          <span>{t("proposals.emptyText")}</span>
          <Link href="/app/hire/candidats?vue=talents" className="t-bt t-sec t-s t-press">
            {t("tabs.discover")}
          </Link>
        </div>
      ) : (
        <ul className="t-verre t-ri-pp">
          {shown.map((row) => {
            const name =
              row.name ?? t("list.anonymous", { headline: row.headline || t("list.noHeadline") });
            return (
              <li key={row.id}>
                <span className={cx("t-rc-av", avatarTone(row.profileId))} aria-hidden>
                  {row.name ? initialsOf(row.name) : "?"}
                </span>
                <Link href={`/app/hire/talents/${row.profileId}`} className="t-t t-press">
                  <b>
                    <span className="t-rc-nom">{name}</span>
                    <span className={cx("t-ri-etq", tag[row.status])}>
                      {t(`proposals.status.${row.status}`)}
                    </span>
                  </b>
                  <span>
                    {[
                      row.jobTitle,
                      row.status === "pending"
                        ? when(row.createdAt)
                        : formatDayMonth(row.respondedAt ?? row.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
                {row.conversationId && (
                  <Link
                    href={`/app/messages/${row.conversationId}`}
                    aria-label={t("proposals.write", { name })}
                    className="t-bi t-press"
                  >
                    <TalentIcon name="message" size="s" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {contacts.limit >= 0 && (
        <div className="t-verre t-ri-quota">
          <p>
            <b>{t("proposals.quota")}</b>
            <span>{t("proposals.quotaValue", { used: contacts.used, max: contacts.limit })}</span>
          </p>
          <span
            className="t-ri-barre"
            role="img"
            aria-label={t("proposals.quotaValue", { used: contacts.used, max: contacts.limit })}
          >
            <i
              style={{
                width: `${Math.min(100, (contacts.used / Math.max(1, contacts.limit)) * 100)}%`,
              }}
            />
          </span>
        </div>
      )}
    </div>
  );
}
