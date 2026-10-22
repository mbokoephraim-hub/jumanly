import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { ApplicationDetail } from "@/components/talent/suivi/application-detail";
import { AutoSelect, DetailOnly } from "@/components/talent/web/auto-select";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { statusChip } from "@/lib/suivi-status";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { suiviBoard, type SuiviCard } from "@/server/services/suivi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("suivi");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * Suivi (planche talent-2 § 2): the applications grouped by situation, what asks for an action
 * first. « Terminées » keeps the ended ones, a refusal with a concrete next step.
 *
 * On a computer (planche web talent-2 § 2) the list and the chosen application sit side by side:
 * a card opens `/app/suivi?id=…` and the address follows the choice (Retour and shared links
 * work). Phone and tablet open the application on its own page (`/app/suivi/[id]`).
 */
export default async function SuiviPage({ searchParams }: PageProps<"/app/suivi">) {
  const user = await requireUser("/app/suivi");
  const query = await searchParams;
  // Modèle B (B5, B9): the applications are a tab of Carrière on a phone, each one its page.
  await phoneTalentRedirect(
    user.id,
    typeof query.id === "string"
      ? `/app/suivi/${encodeURIComponent(query.id.slice(0, 60))}`
      : "/app/career/cv?onglet=candidatures",
  );
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const t = await getTranslations();
  const format = await getFormatter();
  const board = await suiviBoard(db, user.id);
  const finishedView = query.vue === "terminees";
  const current = board.toDo.length + board.waiting.length;
  const view = finishedView ? board.finished : [...board.toDo, ...board.waiting];
  const asked = typeof query.id === "string" ? query.id.slice(0, 60) : null;
  // The application beside the list: the one in the address. Without one, a computer opens the
  // first of the view (AutoSelect); a phone keeps the list alone.
  const selected = asked;
  const first = view.find((item) => item.status !== "draft")?.id ?? null;
  const listHref = (id: string) =>
    `/app/suivi?${finishedView ? "vue=terminees&" : ""}id=${encodeURIComponent(id)}`;

  const card = (item: SuiviCard, ended = false) => {
    const line = ended
      ? `${item.company} · ${formatDayMonth(item.changedAt)}`
      : item.action
        ? item.company
        : `${item.company} · ${format.relativeTime(item.changedAt, { style: "short" })}`;
    const action = item.action;
    return (
      <li key={item.id} className={cx("t-verre t-cd", item.id === selected && "t-sel")}>
        <div className="t-haut">
          <Logo name={item.company} src={item.logo} tone={toneOf(item.company)} />
          <div className="t-t">
            {item.status === "draft" ? (
              <Link href={item.href} className="t-lien">
                <b>{item.title}</b>
              </Link>
            ) : (
              <>
                <Link href={item.href} className="t-lien t-hors-ordi">
                  <b>{item.title}</b>
                </Link>
                <Link
                  href={listHref(item.id)}
                  className="t-lien t-ordi"
                  aria-current={item.id === selected ? "true" : undefined}
                >
                  <b>{item.title}</b>
                </Link>
              </>
            )}
            <span>{line}</span>
            <em className={cx("t-st", statusChip[item.status])}>
              {t(`suivi.status.${item.status}`)}
            </em>
          </div>
        </div>
        {action && (
          <Link
            href={
              action.kind === "slot"
                ? `${item.href}#entretien`
                : action.kind === "document"
                  ? `${item.href}#demandes`
                  : item.href
            }
            className="t-act t-press"
          >
            <TalentIcon name={action.kind === "draft" ? "modifier" : "horloge"} size="xs" />
            <span>
              {action.kind === "slot"
                ? action.before
                  ? t("suivi.action.slotBefore", { date: formatDayMonth(action.before) })
                  : t("suivi.action.slot")
                : action.kind === "document"
                  ? action.due
                    ? t("suivi.action.documentBefore", {
                        name: action.name,
                        date: formatDayMonth(action.due),
                      })
                    : t("suivi.action.document", { name: action.name })
                  : t("suivi.action.draft")}
            </span>
            <TalentIcon name="suivant" size="xs" />
          </Link>
        )}
        {item.similar && (
          <div className="t-rebond">
            <b>{t("suivi.similar.title")}</b>
            <span>{t("suivi.similar.text", { count: item.similar.count })}</span>
            <Link href={item.similar.href} className="t-bt t-sec t-s t-press">
              {t("suivi.similar.cta")}
            </Link>
          </div>
        )}
      </li>
    );
  };

  const group = (id: string, title: string, items: SuiviCard[]) =>
    items.length > 0 && (
      <section aria-labelledby={id} className="t-flux t-serre">
        <h2 id={id} className="t-grp-t">
          {title} <b>{items.length}</b>
        </h2>
        <ul className="t-flux t-serre">{items.map((item) => card(item))}</ul>
      </section>
    );

  const list = (
    <div className="t-flux t-md-l">
      <nav aria-label={t("suivi.tabs")} className="t-seg">
        <Link
          href="/app/suivi"
          aria-current={!finishedView ? "page" : undefined}
          className="t-press"
        >
          {t("suivi.tab.current")}
          <small>{current}</small>
        </Link>
        <Link
          href="/app/suivi?vue=terminees"
          aria-current={finishedView ? "page" : undefined}
          className="t-press"
        >
          {t("suivi.tab.finished")}
        </Link>
      </nav>

      {finishedView ? (
        board.finished.length > 0 ? (
          <ul className="t-flux t-serre">{board.finished.map((item) => card(item, true))}</ul>
        ) : (
          <p className="t-vide-t">{t("suivi.empty.finished")}</p>
        )
      ) : current === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{t("suivi.empty.title")}</b>
          <span>{t("suivi.empty.text")}</span>
          <Link href="/app/jobs" className="t-bt t-p t-s t-press">
            {t("suivi.empty.cta")}
          </Link>
        </div>
      ) : (
        <>
          {group("suivi-afaire", t("suivi.group.toDo"), board.toDo)}
          {group("suivi-attente", t("suivi.group.waiting"), board.waiting)}
        </>
      )}
    </div>
  );

  return (
    <div className={cx("t-flux t-large t-suivi", asked && "t-suivi-id")}>
      <h1 className="sr-only">{t("suivi.title")}</h1>
      {asked && <DetailOnly />}
      {!finishedView && current > 0 && (
        <p className="t-w-sous">
          {t("suivi.web.subtitle", { count: current, actions: board.toDo.length })}
        </p>
      )}
      {query.ok === "retiree" && <Notice tone="ok">{t("suivi.withdrawn")}</Notice>}
      <div className="t-md">
        {list}
        <div className="t-md-d">
          {selected ? (
            <ApplicationDetail userId={user.id} id={selected} query={query} inList />
          ) : (
            <AutoSelect href={first ? listHref(first) : null} from="computer" />
          )}
        </div>
      </div>
    </div>
  );
}
