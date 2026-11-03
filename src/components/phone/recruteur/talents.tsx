import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { can } from "@/server/entitlements";
import { db } from "@/server/db";
import {
  rhAnswerInvitationAction,
  rhConnectAction,
  rhRemindProposalAction,
} from "@/server/actions/phone-rh-talents";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { rhDiscover, rhNetwork, rhProposals } from "@/server/services/hire-phone-talents";
import { cheapestPlanWhere, listPublicPlans } from "@/server/services/plans";
import { listPools, poolsEnabled } from "@/server/services/talent-search";
import { PhoneIcon } from "../icon";
import { initialsOf, RhInitials, RhPct, tintOf } from "./candidatures";
import { RhDomainPicker, RhNewPool } from "./talents-client";
import { RhFiltersSheet } from "./tri-client";
import { FilAvatar } from "../fil/avatar";
import { candidateAvailabilities } from "@/server/services/hire-offer-candidates";
import { studyFields } from "@/lib/studies";

/** The texts the Talents screens need in the browser (sheets). */
export async function RhTalentsTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneRhTalents", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}

export const RH_TALENT_TABS = ["decouvrir", "vivier", "propositions", "reseau"] as const;
export type RhTalentTab = (typeof RH_TALENT_TABS)[number];
const FILTERS = ["toutes", "talents", "rh"] as const;

type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** The filters of « Découvrir », read from the address (never saved). */
function filtersOf(query: Query) {
  const text = (value: string | undefined) => (value ?? "").trim().slice(0, 60);
  return {
    domain: studyFields.find((key) => key === one(query.domaine)),
    title: text(one(query.poste)),
    skill: text(one(query.skill)),
    city: text(one(query.ville)),
    dispo: candidateAvailabilities.find((value) => value === one(query.dispo)),
  };
}

/**
 * « Filtres », on the line of the search (Ephraïm, 03/11/2026): a field (domaine), a job title, a
 * skill, the availability and the city of the talents « Découvrir » shows, never the offers.
 * Saving opens « Découvrir » with them.
 */
export async function RhTalentFilters({ query }: { query: Query }) {
  const t = await getTranslations("phoneRhCandidats");
  const tt = await getTranslations("phoneRhTalents");
  const chosen = filtersOf(query);
  const ts = await getTranslations("access.onboarding.studies.field");
  const count = Object.values(chosen).filter(Boolean).length;
  return (
    <RhFiltersSheet
      label={t("filters.title")}
      countLabel={t("filters.count", { count })}
      count={count}
      closeLabel={t("filters.close")}
      version={JSON.stringify(chosen)}
    >
      <form method="get" action="/app/hire/talents" className="nb-rh-pf-f">
        <div className="nb-ex-f-tete">
          <h2>{t("filters.title")}</h2>
          <Link href="/app/hire/talents">{t("filters.reset")}</Link>
        </div>
        <div className="nb-ex-f-corps">
          <fieldset className="nb-rh-pf-grp">
            <legend className="nb-ex-f-gl">{tt("filters.domain")}</legend>
            <RhDomainPicker
              options={studyFields.map((key) => ({ key, label: ts(key) }))}
              chosen={chosen.domain ?? ""}
              anyLabel={t("filters.any")}
              placeholder={ts("search")}
              none={ts("none")}
            />
          </fieldset>
          <label className="nb-rh-pf-champ">
            <span className="nb-ex-f-gl">{tt("filters.title")}</span>
            <input
              name="poste"
              maxLength={60}
              defaultValue={chosen.title}
              placeholder={tt("filters.titlePlaceholder")}
            />
          </label>
          <label className="nb-rh-pf-champ">
            <span className="nb-ex-f-gl">{t("filters.skill")}</span>
            <input
              name="skill"
              maxLength={60}
              defaultValue={chosen.skill}
              placeholder={t("filters.skillPlaceholder")}
            />
          </label>
          <fieldset className="nb-rh-pf-grp">
            <legend className="nb-ex-f-gl">{t("filters.dispo")}</legend>
            <div className="nb-ex-f-opts">
              {[
                { value: "", label: t("filters.any") },
                ...candidateAvailabilities.map((value) => ({
                  value,
                  label: t(`filters.dispoValue.${value}`),
                })),
              ].map((option) => (
                <label key={option.value || "any"} className="nb-ex-f-opt nb-rh-pf-opt">
                  <input
                    type="radio"
                    name="dispo"
                    value={option.value}
                    defaultChecked={(chosen.dispo ?? "") === option.value}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="nb-rh-pf-champ">
            <span className="nb-ex-f-gl">{t("filters.city")}</span>
            <input name="ville" maxLength={60} defaultValue={chosen.city} />
          </label>
        </div>
        <div className="nb-ex-f-bas">
          <button type="submit" className="nb-ex-f-voir">
            {tt("filters.apply")}
          </button>
        </div>
      </form>
    </RhFiltersSheet>
  );
}

/**
 * The tab Talents of the recruiter's phone (planches 101, 104, 106 and 107): « Découvrir » the
 * visible talents for the offers, the « Vivier », the « Propositions » sent and the « Réseau ».
 */
export async function RhTalents({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhTalents");
  const format = await getFormatter();
  const tab = RH_TALENT_TABS.find((key) => key === one(query.onglet)) ?? "decouvrir";
  const manage = hirePermissions(ctx.role).manage;
  const [pools, proposals, network, plans, poolsOn] = await Promise.all([
    listPools(db, ctx),
    manage ? rhProposals(db, ctx) : Promise.resolve([]),
    rhNetwork(db, ctx.userId),
    listPublicPlans(db),
    poolsEnabled(db, ctx.organizationId),
  ]);
  const waiting = proposals.filter(
    (item) => item.state === "waiting" || item.state === "seen",
  ).length;
  const counts: Record<RhTalentTab, number> = {
    decouvrir: 0,
    vivier: pools.reduce((sum, pool) => sum + pool._count.entries, 0),
    propositions: waiting,
    reseau: network.received.length,
  };
  const href = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const next = {
      onglet: tab === "decouvrir" ? null : tab,
      offre: one(query.offre) ?? null,
      ...changes,
    };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/app/hire/talents?${text}` : "/app/hire/talents";
  };

  const tabs = (
    <nav className="nb-rh-vues" aria-label={t("tabs.label")}>
      {RH_TALENT_TABS.map((key) => (
        <Link
          key={key}
          href={href({ onglet: key === "decouvrir" ? null : key, offre: null, relations: null })}
          aria-current={key === tab ? "page" : undefined}
        >
          {t(`tabs.${key}`)}
          {counts[key] > 0 ? <i>{counts[key]}</i> : null}
        </Link>
      ))}
    </nav>
  );

  let body: ReactNode;
  if (tab === "decouvrir") {
    const offre = one(query.offre) ?? null;
    const filters = filtersOf(query);
    const wanted = {
      domain: filters.domain,
      title: filters.title,
      skill: filters.skill,
      city: filters.city,
      dispo: filters.dispo,
    };
    const discover = manage
      ? await rhDiscover(db, ctx, offre, undefined, wanted).catch(() =>
          rhDiscover(db, ctx, null, undefined, wanted),
        )
      : ({ status: "locked" } as const);
    if (discover.status === "locked") {
      const plan = cheapestPlanWhere(
        plans,
        ["rh", "company"],
        (item) => (item.entitlements["hire.talent_search"] ?? "none") !== "none",
      );
      body = (
        <div className="nb-rh-marge nb-rh-verrou">
          <p>{t("discover.locked")}</p>
          {plan ? <p className="nb-meta">{t("discover.lockedPlan", { plan: plan.name })}</p> : null}
          <Link href="/app/hire/abonnement" className="nb-bs">
            {t("discover.seePlans")}
          </Link>
        </div>
      );
    } else {
      body = (
        <>
          <p className="nb-meta nb-rh-regle">{t("discover.line", { count: discover.total })}</p>
          {discover.cards.length === 0 ? (
            <p className="nb-vide nb-rh-marge">{t("discover.empty")}</p>
          ) : (
            <ul className="nb-rh-tg">
              {discover.cards.map((card) => {
                const name = card.name ?? t("card.anonymous");
                return (
                  <li key={card.profileId}>
                    <Link href={`/app/hire/talents/${card.profileId}`} className="nb-rh-tc">
                      <span className="nb-rh-tc-fond" aria-hidden />
                      <RhInitials id={card.profileId} name={card.name ?? "?"} />
                      <b>{name}</b>
                      <span className="nb-meta">
                        {[card.headline, t("card.years", { years: card.years })]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {card.city ? <span className="nb-meta">{card.city}</span> : null}
                      {card.score !== null ? (
                        <span className="nb-rh-tc-score">
                          <RhPct
                            score={card.score}
                            label={t("card.percent", { score: card.score })}
                          />
                          <span className="nb-meta">{card.jobTitle}</span>
                        </span>
                      ) : null}
                      {card.proposal ? (
                        <span className="nb-rh-tc-etat" data-etat={card.proposal}>
                          {t(`card.${card.proposal}`)}
                        </span>
                      ) : card.inPool ? (
                        <span className="nb-rh-tc-etat">{t("card.inPool")}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="nb-meta nb-rh-marge nb-rh-regle">{t("discover.note")}</p>
        </>
      );
    }
  } else if (tab === "vivier") {
    if (!poolsOn) {
      const plan = cheapestPlanWhere(
        plans,
        ["rh", "company"],
        (item) => item.entitlements["hire.shortlist"] === "true",
      );
      body = (
        <div className="nb-rh-marge nb-rh-verrou">
          <p>{t("pools.locked")}</p>
          {plan ? <p className="nb-meta">{t("discover.lockedPlan", { plan: plan.name })}</p> : null}
          <Link href="/app/hire/abonnement" className="nb-bs">
            {t("discover.seePlans")}
          </Link>
        </div>
      );
    } else {
      const shared = await can(
        db,
        { type: "organization", id: ctx.organizationId },
        "org.talent_pools.shared",
      );
      const sharedPlan = shared
        ? null
        : cheapestPlanWhere(
            plans,
            ["rh", "company"],
            (item) => item.entitlements["org.talent_pools.shared"] === "true",
          );
      body = (
        <div className="nb-rh-marge">
          {pools.length === 0 ? <p className="nb-vide">{t("pools.empty")}</p> : null}
          <ul className="nb-rh-listes">
            {pools.map((pool) => (
              <li key={pool.id}>
                <Link href={`/app/hire/viviers/${pool.id}`} className="nb-rh-liste">
                  <span className="nb-rh-pile-ini" aria-hidden>
                    {pool.entries.map((entry) => (
                      <RhInitials
                        key={entry.profileId}
                        id={entry.profileId}
                        name={
                          entry.profile.visibility === "anonymous" ? "?" : entry.profile.user.name
                        }
                      />
                    ))}
                  </span>
                  <span className="nb-rh-res-t">
                    <b>{pool.name}</b>
                    <span className="nb-meta">
                      {t("pools.count", { count: pool._count.entries })}
                    </span>
                  </span>
                  <PhoneIcon name="chevron" size={18} />
                </Link>
              </li>
            ))}
          </ul>
          {manage ? <RhNewPool /> : null}
          <p className="nb-meta nb-rh-regle">
            {shared
              ? t("pools.noteShared")
              : sharedPlan
                ? t("pools.notePrivate", { plan: sharedPlan.name })
                : t("pools.notePrivateNoPlan")}
          </p>
        </div>
      );
    }
  } else if (tab === "propositions") {
    body = (
      <>
        <p className="nb-meta nb-rh-marge nb-rh-regle">{t("proposals.intro")}</p>
        {proposals.length === 0 ? (
          <p className="nb-vide nb-rh-marge">{t("proposals.empty")}</p>
        ) : (
          <ul className="nb-rh-liste-l">
            {proposals.map((item) => {
              const name = item.name ?? t("card.anonymous");
              return (
                <li key={item.id} className="nb-rh-rang">
                  <Link href={`/app/hire/talents/${item.profileId}`} className="nb-rh-cl">
                    <RhInitials id={item.profileId} name={item.name ?? "?"} />
                    <span className="nb-rh-res-t">
                      <b>{name}</b>
                      <span className="nb-meta">
                        {t("proposals.when", {
                          job: item.jobTitle ?? t("proposals.noJob"),
                          when: format.relativeTime(item.createdAt),
                        })}
                      </span>
                      <span className="nb-rh-prop-etat" data-etat={item.state}>
                        {t(`proposals.state.${item.state}`)}
                      </span>
                    </span>
                    <PhoneIcon name="chevron" size={18} />
                  </Link>
                  {item.canRemind ? (
                    <form action={rhRemindProposalAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="nb-pilule">
                        {t("proposals.remind")}
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <p className="nb-meta nb-rh-marge nb-rh-regle">{t("proposals.note")}</p>
      </>
    );
  } else {
    const filter = FILTERS.find((key) => key === one(query.relations)) ?? "toutes";
    const relations = network.relations.filter(
      (person) =>
        filter === "toutes" ||
        (filter === "talents" ? person.kind === "talent" : person.kind === "rh"),
    );
    const avatar = (id: string, name: string, image: string | null | undefined, size: number) => (
      <FilAvatar
        initials={initialsOf(name)}
        image={image ?? null}
        tone={Number(tintOf(id))}
        org={false}
        size={size}
      />
    );
    // « Réseau » redone (Ephraïm, 03/11/2026: « c'est en désordre »): the invitations first, people
    // to know in a row of cards, then the relations with their filter.
    body = (
      <div className="nb-rh-rs">
        {network.received.length > 0 ? (
          <section aria-labelledby="rh-t-invit" className="nb-rh-rs-bloc">
            <h2 id="rh-t-invit" className="nb-rh-rs-h">
              {t("network.received")}
              <small>{network.received.length}</small>
            </h2>
            <ul className="nb-rh-rs-liste">
              {network.received.map((person) => (
                <li key={person.id} className="nb-rh-rs-ligne" data-invit="">
                  {avatar(person.userId, person.name, person.image, 46)}
                  <span className="nb-rh-rs-t">
                    <b>{person.name}</b>
                    <span>
                      {[t(`network.kind.${person.kind}`), person.title].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <form action={rhAnswerInvitationAction} className="nb-rh-rs-choix">
                    <input type="hidden" name="id" value={person.id} />
                    <button
                      type="submit"
                      name="answer"
                      value="ignore"
                      className="nb-rond"
                      aria-label={t("network.ignore", { name: person.name })}
                    >
                      <PhoneIcon name="fermer" size={18} />
                    </button>
                    <button type="submit" name="answer" value="accept" className="nb-rh-rs-go">
                      {t("network.accept")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="rh-t-know" className="nb-rh-rs-bloc">
          <h2 id="rh-t-know" className="nb-rh-rs-h">
            {t("network.know")}
          </h2>
          {network.know.length === 0 ? (
            <p className="nb-vide">{t("network.none")}</p>
          ) : (
            <ul className="nb-rh-rs-cartes">
              {network.know.map((person) => (
                <li key={person.id} className="nb-rh-rs-carte">
                  <Link href={`/app/personnes/${person.id}`} className="nb-rh-rs-carte-l">
                    {avatar(person.id, person.name, person.image, 64)}
                    <b>{person.name}</b>
                    <span>
                      {[person.title, person.company, person.city].filter(Boolean).join(" · ") ||
                        "\u00a0"}
                    </span>
                    <em data-genre={person.kind}>{t(`network.kind.${person.kind}`)}</em>
                  </Link>
                  <form action={rhConnectAction}>
                    <input type="hidden" name="id" value={person.id} />
                    <button type="submit" className="nb-rh-rs-go">
                      {t("network.connect")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="rh-t-rel" className="nb-rh-rs-bloc">
          <h2 id="rh-t-rel" className="nb-rh-rs-h">
            {t("network.relations")}
            <small>{network.relations.length}</small>
          </h2>
          <nav className="nb-rh-co-onglets nb-rh-rs-filtre" aria-label={t("network.filters")}>
            {FILTERS.map((key) => (
              <Link
                key={key}
                href={href({ relations: key === "toutes" ? null : key })}
                aria-current={key === filter ? "page" : undefined}
                scroll={false}
                replace
              >
                {t(`network.filter.${key}`)}
              </Link>
            ))}
          </nav>
          {relations.length === 0 ? (
            <p className="nb-vide">{t("network.empty")}</p>
          ) : (
            <ul className="nb-rh-rs-liste">
              {relations.map((person) => (
                <li key={person.id}>
                  <Link href={`/app/personnes/${person.userId}`} className="nb-rh-rs-ligne">
                    {avatar(person.userId, person.name, person.image, 46)}
                    <span className="nb-rh-rs-t">
                      <b>{person.name}</b>
                      <span>
                        {[t(`network.kind.${person.kind}`), person.title]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {person.mutual > 0 ? (
                        <small>{t("network.mutual", { count: person.mutual })}</small>
                      ) : null}
                    </span>
                    <PhoneIcon name="chevron" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="nb-rh-talents">
      {tabs}
      <p className="nb-rh-t-aide">{t(`tabs.help.${tab}`)}</p>
      {body}
    </div>
  );
}
