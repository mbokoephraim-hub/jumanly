"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { showToast } from "@/components/motion/toaster";
import { closeJobAction, duplicateJobAction, reopenJobAction } from "@/server/actions/hire";
import { pauseJobAction, resumeJobAction } from "@/server/actions/hire-offers";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

type Sheet = "menu" | "share" | "close" | "report" | null;

export type RhOfferActionsData = {
  id: string;
  title: string;
  status: "published" | "pending_review" | "draft" | "paused" | "closed" | "other";
  /** The public address of the offer (copied, sent by WhatsApp), null before publication. */
  url: string | null;
  org: string;
  /** Applications that receive a message when the offer closes. */
  applications: number;
  /** « Offre clôturée, rapport prêt »: the figures of the report. */
  report: { views: number; applications: number; hired: number; href: string | null } | null;
  manage: boolean;
  /** The sheet opened on arrival (« Clôturer » just done: the report). */
  start: "report" | null;
};

/**
 * The « ··· » of an offer on the recruiter's phone (Modèle B recruteur, M4, planches
 * Recruteur-offre-menu, -partage, -cloturer, -rapport): modify, pause or resume, share (link,
 * Fil, WhatsApp), duplicate, close with its confirmation, then the report in PDF.
 */
export function RhOfferActions({ data }: { data: RhOfferActionsData }) {
  const t = useTranslations("phoneRhOffres.menu");
  const tc = useTranslations("phone");
  const [sheet, setSheet] = useState<Sheet>(data.start);
  // Paused, resumed or closed (the page comes back with the new state): the menu is done.
  const [status, setStatus] = useState(data.status);
  if (status !== data.status) {
    setStatus(data.status);
    setSheet(data.start);
  }
  const close = () => setSheet(null);
  const back = `/app/hire/offres/${data.id}`;
  const live = data.status === "published" || data.status === "pending_review";

  return (
    <>
      {data.manage ? (
        <button
          type="button"
          className="nb-rond nb-rh-plus-menu"
          aria-label={t("open")}
          onClick={() => setSheet("menu")}
        >
          <PhoneIcon name="plusOptions" size={24} stroke={3} />
        </button>
      ) : null}

      <PhoneSheet
        open={sheet === "menu"}
        onClose={close}
        label={data.title}
        closeLabel={tc("close")}
      >
        <p className="nb-meta nb-rh-feuille-sur">{data.title}</p>
        <div className="nb-rh-menu">
          {data.status !== "closed" ? (
            <Link href={`/app/hire/offres/${data.id}/modifier`} className="nb-rh-menu-l">
              <b>{t("edit")}</b>
              <span className="nb-meta">{t("editHint")}</span>
            </Link>
          ) : null}
          {data.status === "published" ? (
            <form action={pauseJobAction}>
              <input type="hidden" name="id" value={data.id} />
              <input type="hidden" name="back" value={back} />
              <button type="submit" className="nb-rh-menu-l">
                <b>{t("pause")}</b>
                <span className="nb-meta">{t("pauseHint")}</span>
              </button>
            </form>
          ) : null}
          {data.status === "paused" ? (
            <form action={resumeJobAction}>
              <input type="hidden" name="id" value={data.id} />
              <input type="hidden" name="back" value={back} />
              <button type="submit" className="nb-rh-menu-l">
                <b>{t("resume")}</b>
                <span className="nb-meta">{t("resumeHint")}</span>
              </button>
            </form>
          ) : null}
          {data.url && live ? (
            <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("share")}>
              <b>{t("share")}</b>
              <span className="nb-meta">{t("shareHint")}</span>
            </button>
          ) : null}
          <form action={duplicateJobAction}>
            <input type="hidden" name="id" value={data.id} />
            <button type="submit" className="nb-rh-menu-l">
              <b>{t("duplicate")}</b>
              <span className="nb-meta">{t("duplicateHint")}</span>
            </button>
          </form>
          {data.status === "closed" ? (
            <form action={reopenJobAction}>
              <input type="hidden" name="id" value={data.id} />
              <button type="submit" className="nb-rh-menu-l">
                <b>{t("reopen")}</b>
                <span className="nb-meta">{t("reopenHint")}</span>
              </button>
            </form>
          ) : null}
          {data.status === "closed" && data.report ? (
            <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("report")}>
              <b>{t("report")}</b>
              <span className="nb-meta">{t("reportHint")}</span>
            </button>
          ) : null}
          {data.status !== "closed" && data.status !== "draft" ? (
            <button
              type="button"
              className="nb-rh-menu-l"
              data-danger=""
              onClick={() => setSheet("close")}
            >
              <b>{t("close")}</b>
              <span className="nb-meta">{t("closeHint")}</span>
            </button>
          ) : null}
        </div>
        <button type="button" className="nb-annuler" onClick={close}>
          {tc("cancel")}
        </button>
      </PhoneSheet>

      <PhoneSheet
        open={sheet === "share"}
        onClose={close}
        label={t("shareTitle")}
        closeLabel={tc("close")}
      >
        <h2 className="nb-rh-feuille-t">{t("shareTitle")}</h2>
        <div className="nb-rh-menu">
          {data.url ? (
            <button
              type="button"
              className="nb-rh-menu-l"
              data-value={data.url}
              onClick={async () => {
                await navigator.clipboard?.writeText(data.url!).catch(() => undefined);
                showToast({ message: t("copied"), tone: "success" });
                close();
              }}
            >
              <b>{t("copy")}</b>
              <span className="nb-meta">{data.url.replace(/^https?:\/\//, "")}</span>
            </button>
          ) : null}
          <Link href={`/app/fil/publier?nom=entreprise`} className="nb-rh-menu-l">
            <b>{t("toFil")}</b>
            <span className="nb-meta">{t("toFilHint", { org: data.org })}</span>
          </Link>
          {data.url ? (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${data.title} · ${data.url}`)}`}
              target="_blank"
              rel="noreferrer"
              className="nb-rh-menu-l"
            >
              <b>{t("whatsapp")}</b>
              <span className="nb-meta">{t("whatsappHint")}</span>
            </a>
          ) : null}
        </div>
        <button type="button" className="nb-annuler" onClick={close}>
          {tc("cancel")}
        </button>
      </PhoneSheet>

      <PhoneSheet
        open={sheet === "close"}
        onClose={close}
        label={t("closeTitle", { title: data.title })}
        closeLabel={tc("close")}
      >
        <div className="nb-rh-confirme">
          <h2>{t("closeTitle", { title: data.title })}</h2>
          <p>{t("closeText", { count: data.applications })}</p>
          <form action={closeJobAction}>
            <input type="hidden" name="id" value={data.id} />
            <input type="hidden" name="back" value={`${back}?rapport=1`} />
            <button type="submit" className="nb-bp" data-danger="">
              {t("closeConfirm")}
            </button>
          </form>
          <button type="button" className="nb-annuler" onClick={close}>
            {t("closeKeep")}
          </button>
        </div>
      </PhoneSheet>

      {data.report ? (
        <PhoneSheet
          open={sheet === "report"}
          onClose={close}
          label={t("reportTitle")}
          closeLabel={tc("close")}
        >
          <div className="nb-rh-confirme">
            <span className="nb-rh-doc-rond" aria-hidden>
              <PhoneIcon name="document" size={26} />
            </span>
            <h2>{t("reportTitle")}</h2>
            <p>
              {t("reportText", {
                views: data.report.views,
                applications: data.report.applications,
                hired: data.report.hired,
              })}
            </p>
            {data.report.href ? (
              <a href={data.report.href} className="nb-bp" download>
                {t("reportDownload")}
              </a>
            ) : (
              <p className="nb-meta">{t("reportLocked")}</p>
            )}
            <button type="button" className="nb-annuler" onClick={close}>
              {t("reportLater")}
            </button>
          </div>
        </PhoneSheet>
      ) : null}
    </>
  );
}

/** « Pourquoi ? » beside one of Orbi's lines: what Orbi counted, and that the recruiter decides. */
export function RhWhy({ label, text }: { label: string; text: string }) {
  const tc = useTranslations("phone");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nb-rh-pourquoi" onClick={() => setOpen(true)}>
        {label}
      </button>
      <PhoneSheet open={open} onClose={() => setOpen(false)} label={label} closeLabel={tc("close")}>
        <div className="nb-rh-confirme">
          <p>{text}</p>
        </div>
        <button type="button" className="nb-annuler" onClick={() => setOpen(false)}>
          {tc("close")}
        </button>
      </PhoneSheet>
    </>
  );
}
