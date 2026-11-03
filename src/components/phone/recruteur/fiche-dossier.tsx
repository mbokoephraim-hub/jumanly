"use client";

import { useState } from "react";
import { MenuArt } from "@/components/site/menu-art";
import { RhDocumentOpen } from "./fiche-document";

export type RhDossierPiece = {
  key: string;
  /** The word on the tab (« Lettre », « CV »…). */
  tab: string;
  art: "cv" | "letter" | "portfolio" | "certificate" | "document";
  title: string;
  /** One line under the title (« 182 mots · 1 min de lecture »). */
  meta: string | null;
  /** The opening of a text, shown as on paper, fading out. */
  excerpt: string | null;
  /** Short lines (experiences, diplomas): the subject in bold, a detail after it. */
  lines: { title: string; detail: string; tone?: "ok" | "manque" }[];
  /** Skills of the CV, those the offer asks for marked. */
  chips: { label: string; match: boolean }[];
  /** The rubber stamp on the sheet (« Reçu », « Lu par Orbi », « Vérifié »). */
  stamp: { label: string; tone: "received" | "read" | "verified" } | null;
  /** The piece is not in the file: an empty sheet with dashes. */
  empty: boolean;
  action: {
    label: string;
    text: string | null;
    href: string;
    external: boolean;
  } | null;
};

/**
 * « Documents » (Ephraïm, 03/11/2026: « quelque chose d'authentique, d'original »): the
 * application as a paper file on the desk. Binder tabs, one per piece; the chosen piece is a real
 * sheet showing what it says (the first lines of the letter, the CV's experiences and skills),
 * with the stamp of its state. A missing piece is an empty dashed sheet.
 */
export function RhDossier({
  pieces,
  closeLabel,
  tabsLabel,
  matchLabel,
}: {
  pieces: RhDossierPiece[];
  closeLabel: string;
  tabsLabel: string;
  matchLabel: string;
}) {
  const [current, setCurrent] = useState(0);
  const piece = pieces[current] ?? pieces[0];
  if (!piece) return null;
  return (
    <div className="nb-rh-dos">
      <div className="nb-rh-dos-onglets" role="tablist" aria-label={tabsLabel}>
        {pieces.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`rh-dos-t-${item.key}`}
            aria-selected={index === current}
            aria-controls="rh-dos-feuille"
            className="nb-rh-dos-onglet"
            data-art={item.art}
            data-vide={item.empty ? "" : undefined}
            onClick={() => setCurrent(index)}
          >
            {item.tab}
          </button>
        ))}
      </div>
      <article
        id="rh-dos-feuille"
        role="tabpanel"
        aria-labelledby={`rh-dos-t-${piece.key}`}
        className="nb-rh-dos-feuille"
        data-art={piece.art}
        data-vide={piece.empty ? "" : undefined}
        key={piece.key}
      >
        <span className="nb-rh-dos-trous" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        {piece.stamp ? (
          <span className="nb-rh-dos-tampon" data-etat={piece.stamp.tone}>
            {piece.stamp.label}
          </span>
        ) : null}
        <header className="nb-rh-dos-tete">
          <span className="nb-rh-dos-art" aria-hidden>
            <MenuArt name={piece.art} size="sm" />
          </span>
          <span className="nb-rh-dos-titre">
            <b>{piece.title}</b>
            {piece.meta ? <small>{piece.meta}</small> : null}
          </span>
        </header>
        {piece.excerpt ? <p className="nb-rh-dos-extrait">{piece.excerpt}</p> : null}
        {piece.lines.length > 0 ? (
          <ul className="nb-rh-dos-lignes">
            {piece.lines.map((line, index) => (
              <li key={index} data-ton={line.tone}>
                <b>{line.title}</b>
                <small>{line.detail}</small>
              </li>
            ))}
          </ul>
        ) : null}
        {piece.chips.length > 0 ? (
          <ul className="nb-rh-dos-puces">
            {piece.chips.map((chip) => (
              <li
                key={chip.label}
                data-offre={chip.match ? "" : undefined}
                title={chip.match ? matchLabel : undefined}
              >
                {chip.label}
              </li>
            ))}
          </ul>
        ) : null}
        {piece.action ? (
          <div className="nb-rh-dos-bas">
            <RhDocumentOpen
              label={piece.action.label}
              ariaLabel={`${piece.action.label} · ${piece.title}`}
              first
              title={piece.title}
              text={piece.action.text}
              href={piece.action.href}
              external={piece.action.external}
              closeLabel={closeLabel}
            />
          </div>
        ) : null}
      </article>
    </div>
  );
}
