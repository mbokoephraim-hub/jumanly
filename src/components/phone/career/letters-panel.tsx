"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition, type CSSProperties } from "react";
import { MenuArt } from "@/components/site/menu-art";
import { showToast } from "@/components/motion/toaster";
import { PROFILE_COLORS, PROFILE_PALETTE, type ProfileColor } from "@/lib/profile-colors";
import {
  deleteLettersAction,
  renameLetterAction,
  setLetterColorAction,
} from "@/server/actions/career-documents";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

/** A cover letter of « Mes documents ». */
export type LetterRow = {
  id: string;
  /** « LT · Assistante en communication ». */
  title: string;
  /** The title as stored, for « Modifier le titre ». */
  name: string;
  line: string;
  href: string;
  tag: { key: ProfileColor; hex: string } | null;
};

/**
 * Soft green and grey grounds for the cards (Ephraïm, 31/10/2026): dark enough to stay calm, light
 * enough to be seen. Picked from the letter or project so each keeps its colour.
 */
const GROUNDS = ["#3d6b57", "#4f7d64", "#5d7f73", "#46635c", "#5e6e69", "#55705f"];
export function groundOf(key: string) {
  let sum = 0;
  for (const char of key) sum = (sum * 31 + char.charCodeAt(0)) >>> 0;
  return GROUNDS[sum % GROUNDS.length];
}

/**
 * « Mes lettres de motivation » (Ephraïm, 31/10/2026): the cards of the CVs, a tap opens the letter
 * to change it, the pencil changes its title and label, « Sélectionner » chooses letters to delete.
 */
export function LettersPanel({ letters }: { letters: LetterRow[] }) {
  const t = useTranslations("phoneCareer");
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<LetterRow | null>(null);
  const [pending, start] = useTransition();
  const ids = letters.map((letter) => letter.id);
  const selected = ids.filter((id) => chosen.has(id));
  const all = selected.length === ids.length && ids.length > 0;
  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const stop = () => {
    setSelecting(false);
    setChosen(new Set());
    setConfirm(false);
  };
  const remove = () =>
    start(async () => {
      const result = await deleteLettersAction(selected).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("form.error"), tone: "error" });
        return;
      }
      showToast({ message: t("letters.deleted", { count: result.count }) });
      stop();
    });

  return (
    <div className="nb-cr-pad">
      <div className="nb-cr-cv-barre">
        <h2 id="nb-doc-lettres" className="nb-cr-cv-titre">
          {t("docs.letters")}
          {letters.length > 0 ? (
            <span aria-label={t("letters.count", { count: letters.length })}>{letters.length}</span>
          ) : null}
        </h2>
        {letters.length > 0 ? (
          <button type="button" onClick={selecting ? stop : () => setSelecting(true)}>
            {selecting ? t("cancel") : t("cv.select.start")}
          </button>
        ) : null}
      </div>
      {selecting ? (
        <div className="nb-cr-cv-barre" data-choix="">
          <b role="status">{t("letters.chosen", { count: selected.length })}</b>
          <button type="button" onClick={() => setChosen(all ? new Set() : new Set(ids))}>
            {all ? t("cv.select.none") : t("cv.select.all")}
          </button>
        </div>
      ) : letters.length > 0 ? (
        <p className="nb-meta nb-lt-aide">{t("letters.help")}</p>
      ) : null}
      {letters.length === 0 ? (
        <p className="nb-pf-vide nb-cr-vide-cv">{t("docs.lettersEmpty")}</p>
      ) : (
        <ul className="nb-doc-rangee" data-rangee="" data-selection={selecting ? "" : undefined}>
          {letters.map((letter, at) => {
            const isChosen = chosen.has(letter.id);
            const card = (
              <>
                <span
                  className="nb-cr-cv-bande"
                  data-lettre=""
                  data-vif=""
                  style={{ "--accent": groundOf(letter.id) } as CSSProperties}
                  aria-hidden
                >
                  <MenuArt name="letter" size="lg" />
                </span>
                <span className="nb-cr-cv-t">
                  <b title={letter.title}>
                    {letter.tag ? <i className="nb-cr-cv-pastille" aria-hidden /> : null}
                    {letter.title}
                  </b>
                  <small>{letter.line}</small>
                </span>
              </>
            );
            return (
              <li
                key={letter.id}
                className="nb-cr-carte nb-cr-cv"
                data-choisi={isChosen ? "" : undefined}
                data-teinte={letter.tag ? "" : undefined}
                style={
                  {
                    animationDelay: `${at * 0.08}s`,
                    "--teinte": letter.tag?.hex,
                  } as CSSProperties
                }
              >
                {selecting ? (
                  <button
                    type="button"
                    className="nb-cr-cv-l"
                    role="checkbox"
                    aria-checked={isChosen}
                    aria-label={letter.title}
                    onClick={() => toggle(letter.id)}
                  >
                    {card}
                    <span className="nb-cr-cv-coche" aria-hidden>
                      {isChosen ? <PhoneIcon name="coche" size={14} stroke={3} /> : null}
                    </span>
                  </button>
                ) : (
                  <>
                    <Link href={letter.href} className="nb-cr-cv-l">
                      {card}
                    </Link>
                    <button
                      type="button"
                      className="nb-cr-cv-plus"
                      aria-label={t("letters.edit", { title: letter.title })}
                      onClick={() => setEditing(letter)}
                    >
                      <PhoneIcon name="modifier" size={18} stroke={2.4} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {selecting ? (
        <div className="nb-cr-cv-actions">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={selected.length === 0 || pending}
            onClick={() => setConfirm(true)}
          >
            {t("letters.delete", { count: selected.length })}
          </button>
        </div>
      ) : (
        <Link href="/app/career/lettres/nouvelle" className="nb-cr-nouveau">
          {t("docs.letterNew")}
        </Link>
      )}
      <PhoneSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        label={t("letters.deleteQuestion", { count: selected.length })}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("letters.deleteQuestion", { count: selected.length })}</b>
        <p className="nb-meta nb-ca-feuille-d">{t("letters.deleteText")}</p>
        <div className="nb-ca-feuille-b">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={pending}
            onClick={remove}
          >
            {t("letters.delete", { count: selected.length })}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-contour=""
            onClick={() => setConfirm(false)}
          >
            {t("cancel")}
          </button>
        </div>
      </PhoneSheet>
      <LetterEdit letter={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/** The pencil of a letter: its title and its label, then « Ouvrir la lettre ». */
function LetterEdit({ letter, onClose }: { letter: LetterRow | null; onClose: () => void }) {
  const t = useTranslations("phoneCareer");
  const [name, setName] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const value = name ?? letter?.name ?? "";
  const close = () => {
    setName(null);
    onClose();
  };
  const fail = () => showToast({ message: t("form.error"), tone: "error" });
  const save = () =>
    letter &&
    start(async () => {
      const result = await renameLetterAction(letter.id, value.trim()).catch(() => null);
      if (!result?.ok) return fail();
      showToast({ message: t("letters.renamed") });
      close();
    });
  const paint = (color: ProfileColor | null) =>
    letter &&
    start(async () => {
      const result = await setLetterColorAction(letter.id, color).catch(() => null);
      if (!result?.ok) return fail();
      close();
    });
  return (
    <PhoneSheet
      open={letter !== null}
      onClose={close}
      label={letter?.title ?? t("docs.letters")}
      closeLabel={t("close")}
    >
      {letter ? (
        <>
          <form
            className="nb-cr-cv-nom"
            onSubmit={(event) => {
              event.preventDefault();
              if (value.trim()) save();
            }}
          >
            <label htmlFor="cr-lt-nom" className="nb-ex-feuille-t">
              {t("letters.title")}
            </label>
            <input
              id="cr-lt-nom"
              value={value}
              maxLength={120}
              required
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="submit"
              className="nb-bouton"
              data-large=""
              data-plein=""
              disabled={pending || !value.trim() || value.trim() === letter.name}
            >
              {t("cv.menu.renameSave")}
            </button>
          </form>
          <div className="nb-cr-cv-teintes" role="group" aria-label={t("letters.label")}>
            <span>{t("letters.label")}</span>
            <button
              type="button"
              aria-pressed={letter.tag === null}
              aria-label={t("cv.menu.colorNone")}
              data-aucune=""
              disabled={pending}
              onClick={() => paint(null)}
            />
            {PROFILE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-pressed={letter.tag?.key === color}
                aria-label={t(`cv.menu.colors.${color}`)}
                style={{ background: PROFILE_PALETTE[color] }}
                disabled={pending}
                onClick={() => paint(color)}
              />
            ))}
          </div>
          <Link href={letter.href} className="nb-opt nb-fil-opt">
            {t("letters.open")}
          </Link>
        </>
      ) : null}
    </PhoneSheet>
  );
}
