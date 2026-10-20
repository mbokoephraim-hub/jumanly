import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import type { JobStatus } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { siteUrl } from "@/lib/seo";
import {
  closeJobAction,
  deleteDraftAction,
  duplicateJobAction,
  reopenJobAction,
} from "@/server/actions/hire";
import { pauseJobAction, resumeJobAction } from "@/server/actions/hire-offers";
import { CopyRow } from "./copy-row";
import type { OfferColor } from "@/server/services/hire-offers";

/** A line of Orbi (planche r1plus `.orbi-l`): what Orbi noticed, and at most one action. */
export function OrbiLine({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="t-rx-orbi">
      <OrbiMark size={26} />
      <p className="t-t">{children}</p>
      {action}
    </div>
  );
}

/** The chip of a job's status (planche `.stp`): published, in review, draft, paused, closed. */
export function statusOf(job: { status: JobStatus; closesAt: Date | null }, now = new Date()) {
  if (job.status === "published" && job.closesAt && job.closesAt <= now)
    return { key: "expired", tone: "t-clo" } as const;
  const tones: Record<JobStatus, string> = {
    published: "t-pub",
    pending_review: "t-val",
    draft: "t-br",
    rejected: "t-err",
    changes_requested: "t-pa",
    paused: "t-pa",
    closed: "t-clo",
    archived: "t-clo",
  };
  return { key: job.status, tone: tones[job.status] } as const;
}

export const publicJobUrl = (slug: string) => `${siteUrl()}/offres/${slug}`;

export type OfferCardJob = {
  id: string;
  slug: string;
  title: string;
  city: string;
  contractType: string;
  remote: string;
  status: JobStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  closesAt: Date | null;
  pausedAt: Date | null;
  pausedByBillingAt?: Date | null;
  color: OfferColor;
  figures: { applications: number; unseen: number; views: number; interviews: number };
};

/**
 * Card of an offer (planche r1plus v2.1 `.off-c`): the colour band, the title and its place, the
 * status and the contract, the four real figures, then the dates and the main action. The « … »
 * button opens the actions of the offer (`OfferSheets`).
 */
export async function OfferCard({
  job,
  org,
  now,
  manage,
  readApplications,
  back,
}: {
  job: OfferCardJob;
  org: string;
  now: Date;
  manage: boolean;
  readApplications: boolean;
  back: string;
}) {
  const t = await getTranslations("hireOffers");
  const status = statusOf(job, now);
  const expired = status.key === "expired";
  const review = job.status === "pending_review";
  const draft = ["draft", "rejected", "changes_requested"].includes(job.status);
  const figures = !review && !draft;
  const ta = await getTranslations("hireAts.entry");
  const candidates = readApplications && (
    <>
      {/* Lot 6: the ATS of the offer, opened by the member (nothing starts by itself). */}
      {job.figures.applications > 0 && (
        <Link
          href={`/app/hire/offres/${job.id}/ats`}
          className="t-bt t-sec t-press t-r6-atsb"
          aria-label={ta("offerCtaAria", { title: job.title })}
        >
          <TalentIcon name="orbi" size="xs" />
          {ta("offerCta")}
        </Link>
      )}
      <Link
        href={`/app/hire/candidats?offre=${job.id}`}
        className="t-bt t-press"
        aria-label={t("card.candidatesAria", { title: job.title })}
      >
        {t("card.candidates")}
      </Link>
    </>
  );
  return (
    <article
      id={`offre-${job.id}`}
      aria-labelledby={`offre-${job.id}-t`}
      className={cx("t-verre t-rx-off", `t-${job.color}`)}
    >
      <div className="t-h">
        <span className="t-rx-ico" aria-hidden>
          <TalentIcon name="offre" size="s" />
        </span>
        <div className="t-t">
          <Link id={`offre-${job.id}-t`} href={`/app/hire/offres/${job.id}`}>
            {job.title}
          </Link>
          <span>{t("card.place", { org, city: job.city })}</span>
        </div>
        <SheetButton
          target={`menu-${job.id}`}
          label={t("card.menu", { title: job.title })}
          className="t-bi t-press"
        >
          <TalentIcon name="plus-options" size="s" />
        </SheetButton>
      </div>
      <div className="t-m">
        <span className={cx("t-rx-stp", status.tone)}>{t(`status.${status.key}`)}</span>
        <span className="t-tag">{t(`contract.${job.contractType}` as "contract.cdi")}</span>
        <span className="t-tag">{t(`remote.${job.remote}` as "remote.onsite")}</span>
      </div>
      {figures && (
        <dl className="t-rx-kp" aria-label={t("card.figures")}>
          {(
            [
              ["applications", job.figures.applications],
              ["unseen", job.figures.unseen],
              ["views", job.figures.views],
              ["interviews", job.figures.interviews],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className={cx(key === "unseen" && value > 0 && "t-nv")}>
              <dt className="sr-only">{t(`card.${key}`, { count: value })}</dt>
              <dd>
                <b>{value.toLocaleString("fr-FR")}</b>
                <span aria-hidden>{t(`card.${key}`, { count: value })}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {review ? (
        <div className="t-rx-val">
          <TalentIcon name="horloge" size="s" />
          <div>
            <b>{t("card.reviewTitle")}</b>
            {t("card.reviewSent", { date: formatDayMonth(job.updatedAt) })}
            <br />
            {t("card.reviewNext")}
          </div>
        </div>
      ) : (
        <div className="t-b">
          {draft ? (
            <>
              <span>
                {job.status === "changes_requested"
                  ? t("card.changes")
                  : job.status === "rejected"
                    ? t("card.rejected")
                    : job.pausedByBillingAt
                      ? t("card.billing")
                      : t("card.draft", { date: formatDayMonth(job.updatedAt) })}
              </span>
              <span className="t-sp" />
              {manage && (
                <Link
                  href={`/app/hire/offres/${job.id}/modifier`}
                  className="t-bt t-press"
                  aria-label={t("card.continueAria", { title: job.title })}
                >
                  {t("card.continue")}
                </Link>
              )}
            </>
          ) : job.status === "paused" ? (
            <>
              <span>
                {t("card.paused", { date: formatDayMonth(job.pausedAt ?? job.updatedAt) })}
              </span>
              <span className="t-sp" />
              {manage && (
                <form action={resumeJobAction}>
                  <input type="hidden" name="id" value={job.id} />
                  <input type="hidden" name="back" value={back} />
                  <button
                    type="submit"
                    className="t-press"
                    aria-label={t("card.resumeAria", { title: job.title })}
                  >
                    {t("card.resume")}
                  </button>
                </form>
              )}
            </>
          ) : job.status === "closed" ? (
            <>
              <span>{t("card.closed")}</span>
              <span className="t-sp" />
              {candidates}
            </>
          ) : (
            <>
              <span className="t-dt">
                {job.publishedAt && (
                  <span>{t("card.published", { date: formatDayMonth(job.publishedAt) })}</span>
                )}
                <span>
                  {expired && job.closesAt
                    ? t("card.expired", { date: formatDayMonth(job.closesAt) })
                    : job.closesAt
                      ? t("card.deadline", { date: formatDayMonth(job.closesAt) })
                      : t("card.noDeadline")}
                </span>
              </span>
              <span className="t-sp" />
              {candidates}
            </>
          )}
        </div>
      )}
    </article>
  );
}

function MenuRow({
  icon,
  tone,
  title,
  text,
  danger,
  chevron = true,
}: {
  icon: TalentIconName;
  tone?: string;
  title: string;
  text?: string;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <>
      <span className={cx("t-cases", tone)} aria-hidden>
        <TalentIcon name={icon} size="s" />
      </span>
      <span className="t-t">
        <b>{title}</b>
        {text && <span>{text}</span>}
      </span>
      {chevron && !danger && <TalentIcon name="suivant" />}
    </>
  );
}

/**
 * The actions of an offer (planche `OFF_MENU`) and the confirmations of « Clôturer » (planche
 * `CLOT`) and « Supprimer le brouillon », each in its own sheet.
 */
export async function OfferSheets({
  job,
  back,
  manage,
  readApplications,
  withView = true,
}: {
  job: Pick<OfferCardJob, "id" | "slug" | "title" | "status" | "figures">;
  back: string;
  manage: boolean;
  readApplications: boolean;
  /** « Voir l'offre », not shown on the offer itself. */
  withView?: boolean;
}) {
  const t = await getTranslations("hireOffers");
  const ta = await getTranslations("hireAts.entry");
  const draft = ["draft", "rejected", "changes_requested"].includes(job.status);
  const live = ["published", "paused", "closed"].includes(job.status);
  const closable = ["published", "paused", "pending_review"].includes(job.status);
  const deletable = job.status === "draft" || job.status === "rejected";
  const editable = manage && job.status !== "closed" && job.status !== "archived";
  return (
    <>
      <Sheet id={`menu-${job.id}`} title={job.title} closeLabel={t("menu.closeSheet")}>
        <ul className="t-verre t-liste t-lignes t-rx-menu">
          {readApplications && live && job.figures.applications > 0 && (
            <li>
              <Link href={`/app/hire/offres/${job.id}/ats`} className="t-li t-press">
                <MenuRow icon="orbi" tone="t-c1" title={ta("menu")} text={ta("menuText")} />
              </Link>
            </li>
          )}
          {readApplications && !draft && (
            <li>
              <Link href={`/app/hire/candidats?offre=${job.id}`} className="t-li t-press">
                <MenuRow
                  icon="candidats"
                  tone="t-c2"
                  title={t("menu.applications")}
                  text={t("menu.applicationsText", {
                    count: job.figures.applications,
                    unseen: job.figures.unseen,
                  })}
                />
              </Link>
            </li>
          )}
          {withView && (
            <li>
              <Link href={`/app/hire/offres/${job.id}`} className="t-li t-press">
                <MenuRow icon="offre" title={t("menu.view")} />
              </Link>
            </li>
          )}
          {editable && (
            <li>
              <Link href={`/app/hire/offres/${job.id}/modifier`} className="t-li t-press">
                <MenuRow icon="modifier" title={draft ? t("menu.continue") : t("menu.edit")} />
              </Link>
            </li>
          )}
          {manage && (
            <li>
              <form action={duplicateJobAction}>
                <input type="hidden" name="id" value={job.id} />
                <button type="submit" className="t-li t-press">
                  <MenuRow
                    icon="document"
                    title={t("menu.duplicate")}
                    text={t("menu.duplicateText")}
                  />
                </button>
              </form>
            </li>
          )}
          {live && (
            <li>
              <CopyRow
                value={publicJobUrl(job.slug)}
                copied={t("menu.copied")}
                className="t-li t-press"
              >
                <MenuRow icon="partager" title={t("menu.copy")} chevron={false} />
              </CopyRow>
            </li>
          )}
          {manage && job.status === "published" && (
            <li>
              <form action={pauseJobAction}>
                <input type="hidden" name="id" value={job.id} />
                <input type="hidden" name="back" value={back} />
                <button type="submit" className="t-li t-press">
                  <MenuRow
                    icon="horloge"
                    tone="t-amb"
                    title={t("menu.pause")}
                    text={t("menu.pauseText")}
                    chevron={false}
                  />
                </button>
              </form>
            </li>
          )}
          {manage && job.status === "paused" && (
            <li>
              <form action={resumeJobAction}>
                <input type="hidden" name="id" value={job.id} />
                <input type="hidden" name="back" value={back} />
                <button type="submit" className="t-li t-press">
                  <MenuRow
                    icon="valider"
                    tone="t-c1"
                    title={t("menu.resume")}
                    text={t("menu.resumeText")}
                    chevron={false}
                  />
                </button>
              </form>
            </li>
          )}
          {manage && job.status === "closed" && (
            <li>
              <form action={reopenJobAction}>
                <input type="hidden" name="id" value={job.id} />
                <button type="submit" className="t-li t-press">
                  <MenuRow
                    icon="envoyer"
                    tone="t-c1"
                    title={t("menu.republish")}
                    text={t("menu.republishText")}
                    chevron={false}
                  />
                </button>
              </form>
            </li>
          )}
          {manage && closable && (
            <li>
              <SheetButton target={`cloture-${job.id}`} className="t-li t-danger t-press">
                <MenuRow icon="fermer" title={t("menu.close")} text={t("menu.closeText")} danger />
              </SheetButton>
            </li>
          )}
          {manage && deletable && (
            <li>
              <SheetButton target={`suppr-${job.id}`} className="t-li t-danger t-press">
                <MenuRow
                  icon="supprimer"
                  title={t("menu.delete")}
                  text={t("menu.deleteText")}
                  danger
                />
              </SheetButton>
            </li>
          )}
        </ul>
      </Sheet>
      {manage && closable && (
        <Sheet id={`cloture-${job.id}`} title={t("close.title")} closeLabel={t("menu.closeSheet")}>
          <div className="t-rx-conf">
            <b>{job.title}</b>
            {t("close.text", { count: job.figures.applications })}
          </div>
          <div className="t-rx-feuille-bts">
            <SheetButton target={`menu-${job.id}`} className="t-bt t-sec t-m t-press">
              {t("close.cancel")}
            </SheetButton>
            <form action={closeJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <button type="submit" className="t-bt t-d t-press">
                {t("close.confirm")}
              </button>
            </form>
          </div>
        </Sheet>
      )}
      {manage && deletable && (
        <Sheet id={`suppr-${job.id}`} title={t("delete.title")} closeLabel={t("menu.closeSheet")}>
          <div className="t-rx-conf">{t("delete.text", { title: job.title })}</div>
          <div className="t-rx-feuille-bts">
            <SheetButton target={`menu-${job.id}`} className="t-bt t-sec t-m t-press">
              {t("close.cancel")}
            </SheetButton>
            <form action={deleteDraftAction}>
              <input type="hidden" name="id" value={job.id} />
              <button type="submit" className="t-bt t-d t-press">
                {t("delete.confirm")}
              </button>
            </form>
          </div>
        </Sheet>
      )}
    </>
  );
}

/** Thumbnail and line of the job sheet in PDF (planche r1plus `.pdf-f`). */
export function PdfRow({
  name,
  line,
  badge,
  bare,
  children,
}: {
  name: string;
  line: string;
  /** « PDF » on the thumbnail. */
  badge: string;
  bare?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cx("t-rx-pdf", bare ? "t-nu" : "t-verre")}>
      <span className="t-rx-th" aria-hidden>
        <i />
        <i />
        <i />
        <i style={{ width: "60%" }} />
        <i />
        <i style={{ width: "80%" }} />
        <em>{badge}</em>
      </span>
      <div className="t-t">
        <b>{name}</b>
        <span>{line}</span>
      </div>
      {children && <div className="t-bts">{children}</div>}
    </div>
  );
}

/** « 340 Ko », « 1,2 Mo » with the texts of `learn.documents.size`. */
export function fileSize(
  bytes: number,
  t: (key: "size.kb" | "size.mb", values: { size: string }) => string,
) {
  return bytes >= 1024 * 1024
    ? t("size.mb", {
        size: (bytes / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 }),
      })
    : t("size.kb", { size: String(Math.max(1, Math.round(bytes / 1024))) });
}
