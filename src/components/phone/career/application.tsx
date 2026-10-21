"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  sendCareerMessageAction,
  withdrawCareerApplicationAction,
} from "@/server/actions/career-phone";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { askOrbi } from "../orbi-bus";
import { PhoneSheet } from "../sheet";

/** Where the page goes back to when it was opened directly: the tab « Candidatures ». */
const APPLICATIONS = "/app/career/cv?onglet=candidatures";

export type ApplicationView = {
  id: string;
  title: string;
  company: string;
  initials: string;
  line: string;
  offer: string;
  steps: { label: string; detail: string; state: "done" | "current" | "next" }[];
  interview: {
    when: string;
    where: string;
    calendar: string;
    join: string | null;
  } | null;
  practice: string;
  cv: { title: string; href: string } | null;
  /** « Écrire à Nadia »: the thread with the recruiting team, and Orbi's draft. */
  write: { conversationId: string; label: string; draft: string } | null;
  /** The three questions of « Préparer avec Orbi ». */
  questions: { people: string; company: string };
  context: string;
  active: boolean;
};

type Sheet = "orbi" | "write" | "withdraw";

/**
 * « Candidature » (planche Carrière-candidature, feuilles -cand-orbi, -cand-ecrire, -cand-retirer):
 * the offer, where the application stands, the interview, Orbi's preparation, the CV sent, a
 * message to the recruiter and the withdrawal. Orbi proposes; the person sends or not.
 */
export function PhoneApplication({ view }: { view: ApplicationView }) {
  const t = useTranslations("phoneCareer.application");
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [text, setText] = useState(view.write?.draft ?? "");
  const [question, setQuestion] = useState("");
  const [pending, start] = useTransition();
  const close = () => setSheet(null);

  const ask = (asked: string) => {
    const clean = asked.trim();
    if (!clean) return;
    close();
    setQuestion("");
    askOrbi(`${clean} (${view.context})`);
  };

  return (
    <div className="nb-page nb-ca-form nb-ca-candidature">
      <header className="nb-ca-form-barre" data-retour-texte="">
        <PhoneBack fallback={APPLICATIONS} label={t("back")} text={t("back")} />
        <h1>{t("title")}</h1>
        <span />
      </header>
      <div className="nb-ca-cand-tete">
        <span className="nb-ca-cand-logo" aria-hidden>
          {view.initials}
        </span>
        <span>
          <b>{view.title}</b>
          <small className="nb-meta">{view.line}</small>
        </span>
        <Link href={view.offer} className="nb-ca-cand-offre">
          {t("offer")}
          <PhoneIcon name="chevron" size={14} />
        </Link>
      </div>
      <section className="nb-ca-cand-suivi" aria-labelledby="cand-ou">
        <p id="cand-ou" className="nb-meta">
          {t("where")}
        </p>
        <ol>
          {view.steps.map((step) => (
            <li key={step.label} data-etat={step.state}>
              <b>{step.label}</b>
              <small>{step.detail}</small>
            </li>
          ))}
        </ol>
      </section>
      {view.interview ? (
        <section className="nb-ca-cand-ent" aria-labelledby="cand-ent">
          <p id="cand-ent" className="nb-ca-cand-k">
            {t("interview")}
          </p>
          <b>{view.interview.when}</b>
          <p className="nb-meta">{view.interview.where}</p>
          <div>
            {view.interview.join ? (
              <a
                href={view.interview.join}
                className="nb-bouton"
                data-plein=""
                target="_blank"
                rel="noreferrer"
              >
                {t("join")}
              </a>
            ) : null}
            <a href={view.interview.calendar} className="nb-bouton" data-contour="">
              {t("calendar")}
            </a>
            <button
              type="button"
              className="nb-bouton"
              data-menthe=""
              onClick={() => setSheet("orbi")}
            >
              {t("prepare")}
            </button>
          </div>
        </section>
      ) : null}
      <div className="nb-ca-cand-lignes">
        <Link href={view.practice} className="nb-ca-it" data-ligne="">
          <span>{t("practice")}</span>
          <small data-lime="">{t("practiceKinds")}</small>
          <PhoneIcon name="chevron" size={18} />
        </Link>
        {view.interview ? null : (
          <button type="button" className="nb-ca-it" data-ligne="" onClick={() => setSheet("orbi")}>
            <span>{t("prepare")}</span>
            <PhoneIcon name="chevron" size={18} />
          </button>
        )}
        {view.cv ? (
          <a href={view.cv.href} className="nb-ca-it" data-ligne="">
            <span>{t("cv")}</span>
            <small>{view.cv.title}</small>
            <PhoneIcon name="chevron" size={18} />
          </a>
        ) : null}
        {view.write ? (
          <button
            type="button"
            className="nb-ca-it"
            data-ligne=""
            onClick={() => setSheet("write")}
          >
            <span>{view.write.label}</span>
            <PhoneIcon name="chevron" size={18} />
          </button>
        ) : null}
        {view.active ? (
          <button
            type="button"
            className="nb-ca-it nb-ca-sortir"
            data-ligne=""
            onClick={() => setSheet("withdraw")}
          >
            {t("withdraw")}
          </button>
        ) : null}
      </div>

      <PhoneSheet
        open={sheet === "orbi"}
        onClose={close}
        label={t("orbiTitle")}
        closeLabel={t("close")}
      >
        <div className="nb-ca-feuille nb-ca-cand-orbi">
          <div className="nb-ca-cand-orbi-t">
            <OrbiDisc size={44} />
            <span>
              <b>{t("orbi")}</b>
              <small className="nb-meta">{t("orbiTitle")}</small>
            </span>
          </div>
          <button type="button" className="nb-ca-cand-q" onClick={() => ask(view.questions.people)}>
            {view.questions.people}
          </button>
          <button
            type="button"
            className="nb-ca-cand-q"
            onClick={() => ask(view.questions.company)}
          >
            {view.questions.company}
          </button>
          <Link href={view.practice} className="nb-ca-cand-q" onClick={close}>
            {t("practice")}
          </Link>
          <form
            className="nb-ca-cand-ecrire"
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t("orbiPlaceholder")}
              aria-label={t("orbiPlaceholder")}
              maxLength={500}
            />
            {question.trim() ? (
              <button type="submit" aria-label={t("orbiSend")}>
                <PhoneIcon name="fleche" size={18} />
              </button>
            ) : null}
          </form>
        </div>
      </PhoneSheet>

      {view.write ? (
        <PhoneSheet
          open={sheet === "write"}
          onClose={close}
          label={view.write.label}
          closeLabel={t("close")}
        >
          <div className="nb-ca-feuille">
            <b className="nb-ex-feuille-t">{view.write.label}</b>
            <textarea
              className="nb-ca-in"
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label={view.write.label}
              maxLength={4000}
              rows={4}
            />
            <p className="nb-meta">{t("draftNote")}</p>
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              data-large=""
              disabled={pending || !text.trim()}
              onClick={() =>
                start(async () => {
                  const result = await sendCareerMessageAction({
                    conversationId: view.write!.conversationId,
                    body: text,
                  }).catch(() => null);
                  if (!result?.ok) {
                    showToast({ message: t("error"), tone: "error" });
                    return;
                  }
                  showToast({ message: t("sent") });
                  close();
                })
              }
            >
              {t("send")}
            </button>
          </div>
        </PhoneSheet>
      ) : null}

      <PhoneSheet
        open={sheet === "withdraw"}
        onClose={close}
        label={t("withdrawQuestion")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("withdrawQuestion")}</b>
        <p className="nb-meta nb-ca-feuille-d">{t("withdrawText", { company: view.company })}</p>
        <div className="nb-ca-feuille-b">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await withdrawCareerApplicationAction(view.id).catch(() => null);
                if (!result?.ok) {
                  showToast({ message: t("error"), tone: "error" });
                  return;
                }
                showToast({ message: t("withdrawn") });
                router.replace(APPLICATIONS);
              })
            }
          >
            {t("withdrawConfirm")}
          </button>
          <button type="button" className="nb-bouton" data-large="" data-contour="" onClick={close}>
            {t("cancel")}
          </button>
        </div>
      </PhoneSheet>
    </div>
  );
}
