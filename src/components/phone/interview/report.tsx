"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { retakePhoneInterviewAction } from "@/server/actions/interview-phone";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import type { AnswerView, HistoryRow, ReportView } from "./types";

/** 70 and more in Lime, below in amber (planche Entretien-bilan). */
const tone = (score: number | null) => (score === null ? undefined : score >= 70 ? "bon" : "moyen");
const RING = 2 * Math.PI * 52;

/** « Refaire … »: a new short session with these questions, then its page. */
function useRetake(id: string, query: string) {
  const t = useTranslations("phoneInterview");
  const router = useRouter();
  const [pending, start] = useTransition();
  const retake = (indexes: number[]) =>
    start(async () => {
      const result = await retakePhoneInterviewAction({ id, indexes }).catch(() => null);
      if (!result?.ok) {
        if (result?.error === "entitlement" || result?.error === "quota") {
          router.push(`/app/career/entretiens/nouveau${query ? `?${query}` : ""}`);
          return;
        }
        showToast({ message: t("error.network"), tone: "error" });
        return;
      }
      router.push(`/app/career/entretiens/${result.id}${query ? `?${query}` : ""}`);
    });
  return { retake, pending };
}

/**
 * « Votre bilan » (planche Entretien-bilan): the mark out of 100 and its four criteria, each with
 * its reason, what works, what to work on, and each question's mark. Private, never shown to a
 * recruiter; the mark measures the answers, it does not predict a hiring.
 */
export function PhoneInterviewReport({ view }: { view: ReportView }) {
  const t = useTranslations("phoneInterview");
  const { retake, pending } = useRetake(view.id, view.origin.query);
  return (
    <div className="nb-page nb-iv nb-iv-bilan" data-ecran="">
      <div className="nb-iv-barre" data-entre="">
        {view.fromHistory ? (
          <PhoneBack fallback="/app/career/entretiens" label={t("history")} text={t("history")} />
        ) : (
          <Link
            href={view.origin.backHref}
            replace
            className="nb-retour"
            aria-label={t("report.close")}
          >
            <PhoneIcon name="fermer" size={22} stroke={2} />
          </Link>
        )}
        <span className="nb-meta">{t("report.private")}</span>
      </div>
      <div className="nb-iv-score">
        <span className="nb-iv-anneau" data-ton={tone(view.overall)}>
          <svg viewBox="0 0 124 124" aria-hidden>
            <circle cx="62" cy="62" r="52" />
            <circle
              cx="62"
              cy="62"
              r="52"
              strokeDasharray={`${((view.overall ?? 0) * RING) / 100} ${RING}`}
            />
          </svg>
          <span>
            <b>{view.overall ?? "–"}</b>
            <small className="nb-meta">{t("report.outOf")}</small>
          </span>
        </span>
        <h1 className="nb-h1">{t("report.title")}</h1>
        <p className="nb-iv-sous">{view.summary}</p>
      </div>
      <div className="nb-iv-corps">
        {view.overall === null ? (
          <p className="nb-iv-vide">{t("report.none")}</p>
        ) : (
          <>
            <ul className="nb-iv-criteres">
              {view.criteria.map((item) => (
                <li key={item.label} data-ton={tone(item.score)}>
                  <span>
                    <b>{item.label}</b>
                    <b>{item.score}</b>
                  </span>
                  <i aria-hidden>
                    <i style={{ width: `${item.score}%` }} />
                  </i>
                  <small className="nb-meta">{item.reason}</small>
                </li>
              ))}
            </ul>
            <p className="nb-meta nb-iv-pourquoi">{t("report.why")}</p>
            {view.works.length > 0 ? (
              <div className="nb-iv-boite" data-ton="bon">
                <b>{t("report.works")}</b>
                {view.works.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
            {view.toWork.length > 0 ? (
              <div className="nb-iv-boite" data-ton="moyen">
                <b>{view.toWorkTitle}</b>
                {view.toWork.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </>
        )}
        <p className="nb-iv-gr">{t("report.byQuestion")}</p>
        <ul className="nb-iv-liste">
          {view.questions.map((item) => (
            <li key={item.n}>
              <Link href={item.href} className="nb-iv-ligne">
                <span className="nb-meta">{item.n}</span>
                <span>{item.question}</span>
                <b data-ton={tone(item.score)}>{item.score ?? t("report.unanswered")}</b>
              </Link>
            </li>
          ))}
        </ul>
        <div className="nb-iv-fin">
          {view.weak.length > 0 ? (
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              data-large=""
              disabled={pending}
              onClick={() => retake(view.weak)}
            >
              {t("report.weak", { count: view.weak.length })}
            </button>
          ) : null}
          <Link href={view.settings} className="nb-bouton" data-contour="" data-large="">
            {t("report.new")}
          </Link>
          {view.origin.endLabel ? (
            <Link href={view.origin.backHref} replace className="nb-iv-discret">
              {view.origin.endLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The detail of an answer (planche Entretien-reponse). */
export function PhoneInterviewAnswer({ view, query }: { view: AnswerView; query: string }) {
  const t = useTranslations("phoneInterview");
  const { retake, pending } = useRetake(view.id, query);
  return (
    <div className="nb-page nb-iv nb-iv-detail" data-ecran="">
      <div className="nb-iv-barre">
        <PhoneBack fallback={view.back} label={t("answer.back")} text={t("answer.back")} />
      </div>
      <div className="nb-iv-corps">
        <div className="nb-iv-detail-h">
          <span className="nb-meta">{t("answer.question", { n: view.n })}</span>
          {view.score !== null ? (
            <b data-ton={tone(view.score)}>{t("answer.score", { score: view.score })}</b>
          ) : null}
        </div>
        <h1 className="nb-iv-detail-q">{view.question}</h1>
        <p className="nb-iv-gr">{view.saidTitle}</p>
        {view.text ? (
          <>
            <p className="nb-iv-dit">{t("quoted", { text: view.text })}</p>
            {view.meta ? <p className="nb-meta">{view.meta}</p> : null}
            {view.followUp ? <p className="nb-meta nb-iv-dit-r">{view.followUp}</p> : null}
          </>
        ) : (
          <p className="nb-meta">{t("report.unanswered")}</p>
        )}
        <div className="nb-iv-boites">
          {view.works.length > 0 ? (
            <div className="nb-iv-boite" data-ton="bon">
              <b>{t("answer.works")}</b>
              {view.works.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {view.improve.length > 0 ? (
            <div className="nb-iv-boite" data-ton="moyen">
              <b>{t("answer.improve")}</b>
              {view.improve.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {view.tip ? (
            <div className="nb-iv-boite" data-ton="orbi">
              <OrbiDisc size={26} />
              <span>
                <b>{t("answer.tip")}</b>
                <p>{view.tip}</p>
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="nb-iv-bas">
        <button
          type="button"
          className="nb-bouton"
          data-plein=""
          data-large=""
          disabled={pending}
          onClick={() => retake([view.index])}
        >
          {t("answer.retry")}
        </button>
        {view.next ? (
          <Link href={view.next} replace className="nb-iv-discret">
            {t("answer.next")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** « Mes simulations » (planche Entretien-historique). */
export function PhoneInterviewHistory({ rows }: { rows: HistoryRow[] }) {
  const t = useTranslations("phoneInterview");
  return (
    <div className="nb-page nb-iv nb-iv-hist-page" data-ecran="">
      <div className="nb-iv-barre">
        <PhoneBack
          fallback="/app/career/entretiens/nouveau"
          label={t("list.back")}
          text={t("list.back")}
        />
      </div>
      <div className="nb-iv-corps">
        <h1 className="nb-h1">{t("list.title")}</h1>
        <p className="nb-iv-sous">{t("list.text")}</p>
        {rows.length === 0 ? (
          <div className="nb-iv-vide">
            <p>{t("list.empty")}</p>
            <Link href="/app/career/entretiens/nouveau" className="nb-bouton" data-plein="">
              {t("list.new")}
            </Link>
          </div>
        ) : (
          <ul className="nb-iv-liste">
            {rows.map((row) => (
              <li key={row.href}>
                <Link href={row.href} className="nb-iv-ligne" data-hist="">
                  <span>
                    <b>{row.title}</b>
                    <small className="nb-meta">{row.meta}</small>
                  </span>
                  {row.ongoing ? (
                    <small className="nb-iv-encours">{t("list.ongoing")}</small>
                  ) : (
                    <b data-ton={tone(row.score)}>{row.score ?? "–"}</b>
                  )}
                  <PhoneIcon name="chevron" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
