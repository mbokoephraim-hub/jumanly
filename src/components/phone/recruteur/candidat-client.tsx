"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { requestDocumentAction } from "@/server/actions/hire";
import {
  decideAction,
  moveCandidateAction,
  undoDecisionAction,
} from "@/server/actions/hire-candidates";
import { rhAssignAction } from "@/server/actions/phone-rh-candidatures";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { levelOf } from "./level";

type Tab = "resume" | "cv" | "reponses" | "notes" | "historique";
const TABS: Tab[] = ["resume", "cv", "reponses", "notes", "historique"];
type Sheet = "why" | "menu" | "stage" | "assign" | "pdf" | "reject" | "recruit" | "document" | null;

/** The reasons of « Ne pas retenir » (for the team only), in the order of the planche. */
const REASONS = ["skills", "otherCandidate", "other", "positionClosed"] as const;
const DOCUMENTS = ["diploma", "certificate", "references"] as const;
const PARTS = ["fiche", "cv", "reponses", "notes", "historique"] as const;

export type RhFileData = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  tint: string;
  line1: string;
  line2: string;
  jobTitle: string;
  back: string;
  score: { label: string; value: number; band: string } | null;
  why: {
    title: string;
    line: string;
    rows: { label: string; value: string; share: number }[];
    locked: string | null;
    notUsed: string;
  } | null;
  stage: { id: string; name: string };
  stages: { id: string; name: string; kind: string }[];
  /** The member may change the stage, plan, decide (active application, not decided). */
  live: boolean;
  manage: boolean;
  assignee: string | null;
  assigneeId: string | null;
  members: { id: string; name: string; initials: string; sub: string }[];
  planned: string | null;
  primary:
    { kind: "link"; label: string; href: string } | { kind: "recruit"; label: string } | null;
  messageHref: string;
  reject: { message: string };
  recruit: { message: string };
  notesCount: number;
  tab: Tab;
  error: string | null;
  pdfHref: string;
  canPdf: boolean;
  /** « Demander un document »: due in a week by default (YYYY-MM-DD). */
  dueDefault: string;
  /** A decision taken less than 10 minutes ago: « Annulable encore … » and « Annuler ». */
  undo: { line: string; button: string } | null;
};

/**
 * The file of one candidate on the phone (planches Recruteur-candidat, -pourquoi, -cv, -reponses,
 * -notes, -historique, -menu, -etape, -repartir, -pdf, -nonretenu): the tabs, the « ··· » and its
 * sheets, the bottom bar with « Écrire » and the next step.
 */
export function RhFile({ data, panels }: { data: RhFileData; panels: Record<Tab, ReactNode> }) {
  const t = useTranslations("phoneRhCandidatures");
  const tc = useTranslations("phone");
  const [tab, setTab] = useState<Tab>(data.tab);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("skills");
  const [parts, setParts] = useState<string[]>(PARTS.filter((part) => part !== "historique"));
  const [documentName, setDocumentName] = useState<string>(t("document.kinds.diploma"));
  // The page comes back after a gesture (stage changed, note added…): the sheet is done.
  const [seen, setSeen] = useState(data.stage.id + data.notesCount + data.assigneeId);
  const key = data.stage.id + data.notesCount + data.assigneeId;
  if (key !== seen) {
    setSeen(key);
    setSheet(null);
  }
  const close = () => setSheet(null);

  const chooseStage = (kind: string) => {
    if (kind === "hired") setSheet("recruit");
    else if (kind === "rejected") setSheet("reject");
  };

  return (
    <div className="nb-page nb-rh-detail nb-rh-fiche">
      <header className="nb-rh-barre">
        <Link href={data.back} className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("file.back")}
        </Link>
        <button
          type="button"
          className="nb-rond nb-rh-plus-menu"
          aria-label={t("menu.open", { name: data.name })}
          onClick={() => setSheet("menu")}
        >
          <PhoneIcon name="plusOptions" size={24} stroke={3} />
        </button>
      </header>
      {data.error ? (
        <p className="nb-erreur nb-rh-marge" role="alert">
          {data.error}
        </p>
      ) : null}
      {data.undo ? (
        <form action={undoDecisionAction} className="nb-rh-annuler" role="status">
          <input type="hidden" name="application" value={data.id} />
          <span>{data.undo.line}</span>
          <button type="submit">{data.undo.button}</button>
        </form>
      ) : null}
      <section className="nb-rh-f-id" aria-labelledby="rh-f-nom">
        <span className="nb-rh-ini nb-rh-ini-l" data-teinte={data.tint} aria-hidden>
          {data.initials}
        </span>
        <span>
          <h1 id="rh-f-nom">{data.name}</h1>
          {data.line1 ? <p className="nb-meta">{data.line1}</p> : null}
          <p className="nb-meta">{data.line2}</p>
        </span>
      </section>
      <div className="nb-rh-f-cartes">
        {data.score ? (
          <button type="button" className="nb-rh-f-carte" onClick={() => setSheet("why")}>
            <span className="nb-rh-pct" data-niveau={levelOf(data.score.value)}>
              {data.score.label}
            </span>
            <span>
              <b>{data.score.band}</b>
              <span className="nb-rh-pourquoi">{t("why.open")}</span>
            </span>
          </button>
        ) : (
          <div className="nb-rh-f-carte">
            <span className="nb-meta">{t("why.none")}</span>
          </div>
        )}
        {data.live ? (
          <button
            type="button"
            className="nb-rh-f-carte"
            aria-label={t("stage.change", { stage: data.stage.name })}
            onClick={() => setSheet("stage")}
          >
            <span>
              <span className="nb-meta">{t("stage.label")}</span>
              <b className="nb-rh-f-etape">
                {data.stage.name}
                <PhoneIcon name="bas" size={16} />
              </b>
            </span>
          </button>
        ) : (
          <div className="nb-rh-f-carte">
            <span>
              <span className="nb-meta">{t("stage.label")}</span>
              <b className="nb-rh-f-etape">{data.stage.name}</b>
            </span>
          </div>
        )}
      </div>
      <p className="nb-meta nb-rh-f-offre">{data.jobTitle}</p>
      <div className="nb-rh-f-onglets" role="tablist" aria-label={t("tabs.label")}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`rh-f-${key}`}
            aria-selected={tab === key}
            aria-controls={`rh-f-p-${key}`}
            onClick={() => setTab(key)}
          >
            {t(`tabs.${key}`)}
            {key === "notes" && data.notesCount > 0 ? <i>{data.notesCount}</i> : null}
          </button>
        ))}
      </div>
      {TABS.map((key) => (
        <div
          key={key}
          role="tabpanel"
          id={`rh-f-p-${key}`}
          aria-labelledby={`rh-f-${key}`}
          hidden={tab !== key}
          className="nb-rh-f-panneau"
        >
          {panels[key]}
        </div>
      ))}

      <div className="nb-bas nb-rh-f-bas">
        {data.manage ? (
          <Link href={data.messageHref} className="nb-rh-f-ecrire" aria-label={t("file.write")}>
            <PhoneIcon name="messages" size={22} />
          </Link>
        ) : null}
        {data.primary?.kind === "link" ? (
          <Link href={data.primary.href} className="nb-bp">
            {data.primary.label}
          </Link>
        ) : data.primary?.kind === "recruit" ? (
          <button type="button" className="nb-bp" onClick={() => setSheet("recruit")}>
            {data.primary.label}
          </button>
        ) : null}
      </div>

      {/* Pourquoi ce score (planche Recruteur-candidat-pourquoi) */}
      {data.why && data.score ? (
        <PhoneSheet
          open={sheet === "why"}
          onClose={close}
          label={data.why.title}
          closeLabel={tc("close")}
        >
          <div className="nb-rh-why-h">
            <span className="nb-rh-pct nb-rh-pct-l" data-niveau={levelOf(data.score.value)}>
              {data.score.label}
            </span>
            <span>
              <h2>{data.why.title}</h2>
              <p className="nb-meta">{data.why.line}</p>
            </span>
          </div>
          {data.why.rows.map((row) => (
            <div key={row.label} className="nb-rh-why-l">
              <p>
                <span>{row.label}</span>
                <span className="nb-meta">{row.value}</span>
              </p>
              <span className="nb-rh-jauge" aria-hidden>
                <i
                  style={{ width: `${row.share * 100}%` }}
                  data-plein={row.share >= 0.9 ? "" : undefined}
                />
              </span>
            </div>
          ))}
          {data.why.locked ? <p className="nb-meta">{data.why.locked}</p> : null}
          <p className="nb-meta nb-rh-why-n">{data.why.notUsed}</p>
          <button type="button" className="nb-annuler" onClick={close}>
            {tc("close")}
          </button>
        </PhoneSheet>
      ) : null}

      {/* « ··· » (planche Recruteur-candidat-menu) */}
      <PhoneSheet
        open={sheet === "menu"}
        onClose={close}
        label={data.name}
        closeLabel={tc("close")}
      >
        <p className="nb-meta nb-rh-feuille-sur">{data.name}</p>
        <div className="nb-rh-menu">
          {data.live ? (
            <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("stage")}>
              <b>{t("menu.stage")}</b>
              <span className="nb-meta">{t("menu.stageHint", { stage: data.stage.name })}</span>
            </button>
          ) : null}
          {data.manage ? (
            <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("assign")}>
              <b>{t("menu.assign")}</b>
              <span className="nb-meta">
                {data.assignee
                  ? t("menu.assignHint", { name: data.assignee })
                  : t("menu.assignNobody")}
              </span>
            </button>
          ) : null}
          {data.live ? (
            <Link href={`/app/hire/candidats/${data.id}/entretien`} className="nb-rh-menu-l">
              <b>{t("menu.plan")}</b>
              <span className="nb-meta">
                {data.planned ? t("menu.planned", { date: data.planned }) : t("menu.planHint")}
              </span>
            </Link>
          ) : null}
          {data.manage ? (
            <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("document")}>
              <b>{t("menu.document")}</b>
              <span className="nb-meta">{t("menu.documentHint")}</span>
            </button>
          ) : null}
          {data.canPdf ? (
            <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("pdf")}>
              <b>{t("menu.pdf")}</b>
              <span className="nb-meta">{t("menu.pdfHint")}</span>
            </button>
          ) : null}
          {data.live ? (
            <button
              type="button"
              className="nb-rh-menu-l"
              data-danger=""
              onClick={() => setSheet("reject")}
            >
              <b>{t("menu.reject")}</b>
              <span className="nb-meta">{t("menu.rejectHint")}</span>
            </button>
          ) : null}
        </div>
        <button type="button" className="nb-annuler" onClick={close}>
          {tc("cancel")}
        </button>
      </PhoneSheet>

      {/* Changer d'étape (planche Recruteur-candidat-etape) */}
      {data.live ? (
        <PhoneSheet
          open={sheet === "stage"}
          onClose={close}
          label={t("menu.stage")}
          closeLabel={tc("close")}
        >
          <h2 className="nb-rh-feuille-t">{t("menu.stage")}</h2>
          <div className="nb-rh-menu">
            {data.stages.map((stage) =>
              stage.kind === "hired" || stage.kind === "rejected" ? (
                <button
                  key={stage.id}
                  type="button"
                  className="nb-rh-etape-l"
                  onClick={() => chooseStage(stage.kind)}
                >
                  {stage.name}
                </button>
              ) : (
                <form key={stage.id} action={moveCandidateAction}>
                  <input type="hidden" name="application" value={data.id} />
                  <input type="hidden" name="stage" value={stage.id} />
                  <button
                    type="submit"
                    className="nb-rh-etape-l"
                    aria-current={stage.id === data.stage.id ? "step" : undefined}
                    disabled={stage.id === data.stage.id}
                  >
                    {stage.name}
                    {stage.id === data.stage.id ? <PhoneIcon name="coche" size={18} /> : null}
                  </button>
                </form>
              ),
            )}
          </div>
          <button type="button" className="nb-annuler" onClick={close}>
            {tc("cancel")}
          </button>
        </PhoneSheet>
      ) : null}

      {/* Répartir à un collègue (planche Recruteur-candidat-repartir) */}
      {data.manage ? (
        <PhoneSheet
          open={sheet === "assign"}
          onClose={close}
          label={t("assign.title", { name: data.firstName })}
          closeLabel={tc("close")}
        >
          <h2 className="nb-rh-feuille-t">{t("assign.title", { name: data.firstName })}</h2>
          <p className="nb-meta nb-rh-feuille-sur">{t("assign.hint")}</p>
          <div className="nb-rh-menu">
            {data.members.map((member) => (
              <form key={member.id} action={rhAssignAction}>
                <input type="hidden" name="application" value={data.id} />
                <input type="hidden" name="member" value={member.id} />
                <button
                  type="submit"
                  className="nb-rh-membre"
                  aria-current={member.id === data.assigneeId ? "true" : undefined}
                >
                  <span className="nb-rh-ini" data-teinte="n" aria-hidden>
                    {member.initials}
                  </span>
                  <span className="nb-rh-res-t">
                    <b>{member.name}</b>
                    <span className="nb-meta">{member.sub}</span>
                  </span>
                  {member.id === data.assigneeId ? <PhoneIcon name="coche" size={18} /> : null}
                </button>
              </form>
            ))}
          </div>
          <button type="button" className="nb-annuler" onClick={close}>
            {tc("cancel")}
          </button>
        </PhoneSheet>
      ) : null}

      {/* Télécharger en PDF (planche Recruteur-candidat-pdf) */}
      {data.canPdf ? (
        <PhoneSheet
          open={sheet === "pdf"}
          onClose={close}
          label={t("pdf.title")}
          closeLabel={tc("close")}
        >
          <div className="nb-rh-pdf">
            <div className="nb-rh-pdf-h">
              <span className="nb-rh-doc-i" aria-hidden>
                <PhoneIcon name="document" size={22} />
              </span>
              <span>
                <h2>{t("pdf.title")}</h2>
                <p className="nb-meta">{data.name}</p>
              </span>
            </div>
            <fieldset>
              <legend className="nb-meta">{t("pdf.content")}</legend>
              {PARTS.map((part) => (
                <label key={part} className="nb-rh-cocher">
                  <input
                    type="checkbox"
                    checked={parts.includes(part)}
                    onChange={(event) =>
                      setParts(
                        event.target.checked
                          ? [...parts, part]
                          : parts.filter((value) => value !== part),
                      )
                    }
                  />
                  <span>{t(`pdf.parts.${part}`)}</span>
                </label>
              ))}
            </fieldset>
            <p className="nb-meta">{t("pdf.rule")}</p>
            {/* A link, not a form: the file downloads without leaving the file. */}
            <a
              href={`${data.pdfHref}?${new URLSearchParams(parts.map((part) => ["partie", part]))}`}
              download
              className="nb-bp"
              aria-disabled={parts.length === 0 || undefined}
              onClick={(event) => (parts.length === 0 ? event.preventDefault() : close())}
            >
              {t("pdf.download")}
            </a>
            <button type="button" className="nb-annuler" onClick={close}>
              {tc("cancel")}
            </button>
          </div>
        </PhoneSheet>
      ) : null}

      {/* Ne pas retenir (planche Recruteur-candidat-nonretenu) */}
      {data.live ? (
        <PhoneSheet
          open={sheet === "reject"}
          onClose={close}
          label={t("reject.title", { name: data.firstName })}
          closeLabel={tc("close")}
        >
          <form action={decideAction} className="nb-rh-decision">
            <h2 className="nb-rh-feuille-t">{t("reject.title", { name: data.firstName })}</h2>
            <input type="hidden" name="application" value={data.id} />
            <input type="hidden" name="outcome" value="rejected" />
            <input type="hidden" name="retour" value="fiche" />
            <input type="hidden" name="reason" value={reason} />
            <p className="nb-meta">{t("reject.reason")}</p>
            <div className="nb-rh-puces-c" role="radiogroup" aria-label={t("reject.reason")}>
              {REASONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={reason === key}
                  className="nb-pilule"
                  onClick={() => setReason(key)}
                >
                  {t(`reject.reasons.${key}`)}
                </button>
              ))}
            </div>
            <label className="nb-meta" htmlFor="rh-f-refus">
              {t("reject.messageLabel")}
            </label>
            <textarea
              id="rh-f-refus"
              name="message"
              required
              minLength={2}
              maxLength={4000}
              rows={5}
              defaultValue={data.reject.message}
              className="nb-rh-zone"
            />
            <button type="submit" className="nb-bp">
              {t("reject.send")}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {tc("cancel")}
            </button>
          </form>
        </PhoneSheet>
      ) : null}

      {/* Recruter : la décision et son message */}
      {data.live ? (
        <PhoneSheet
          open={sheet === "recruit"}
          onClose={close}
          label={t("recruit.title", { name: data.firstName })}
          closeLabel={tc("close")}
        >
          <form action={decideAction} className="nb-rh-decision">
            <h2 className="nb-rh-feuille-t">{t("recruit.title", { name: data.firstName })}</h2>
            <input type="hidden" name="application" value={data.id} />
            <input type="hidden" name="outcome" value="hired" />
            <input type="hidden" name="retour" value="fiche" />
            <label className="nb-meta" htmlFor="rh-f-oui">
              {t("reject.messageLabel")}
            </label>
            <textarea
              id="rh-f-oui"
              name="message"
              required
              minLength={2}
              maxLength={4000}
              rows={5}
              defaultValue={data.recruit.message}
              className="nb-rh-zone"
            />
            <button type="submit" className="nb-bp">
              {t("recruit.send")}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {tc("cancel")}
            </button>
          </form>
        </PhoneSheet>
      ) : null}

      {/* Demander un document */}
      {data.manage ? (
        <PhoneSheet
          open={sheet === "document"}
          onClose={close}
          label={t("menu.document")}
          closeLabel={tc("close")}
        >
          <form action={requestDocumentAction} className="nb-rh-decision">
            <h2 className="nb-rh-feuille-t">{t("menu.document")}</h2>
            <input type="hidden" name="application" value={data.id} />
            <div className="nb-rh-puces-c">
              {DOCUMENTS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="nb-pilule"
                  aria-pressed={documentName === t(`document.kinds.${kind}`)}
                  onClick={() => setDocumentName(t(`document.kinds.${kind}`))}
                >
                  {t(`document.kinds.${kind}`)}
                </button>
              ))}
            </div>
            <label className="nb-meta" htmlFor="rh-f-doc">
              {t("document.name")}
            </label>
            <input
              id="rh-f-doc"
              name="name"
              required
              minLength={2}
              maxLength={120}
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              className="nb-rh-champ-l"
            />
            <label className="nb-meta" htmlFor="rh-f-echeance">
              {t("document.due")}
            </label>
            <input
              id="rh-f-echeance"
              name="due"
              type="date"
              required
              defaultValue={data.dueDefault}
              className="nb-rh-champ-l"
            />
            <label className="nb-meta" htmlFor="rh-f-mot">
              {t("document.note")}
            </label>
            <textarea id="rh-f-mot" name="note" maxLength={1000} rows={3} className="nb-rh-zone" />
            <button type="submit" className="nb-bp">
              {t("document.send")}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {tc("cancel")}
            </button>
          </form>
        </PhoneSheet>
      ) : null}
    </div>
  );
}
