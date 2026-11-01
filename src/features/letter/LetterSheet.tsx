/**
 * A cover letter laid out in one of its six templates, on the screen (thumbnails of « Choisir le
 * modèle » and the preview before « Enregistrer »). Every size is in % of the page width (cqw), so
 * the same sheet reads the same at any width; the PDF uses the same layout (letter-document.tsx).
 */
import type { CSSProperties } from "react";
import {
  colorHex,
  letterLayouts,
  nameParts,
  paragraphsOf,
  tint,
  U,
  type LetterDesign,
  type LetterSheetData,
} from "./design";

const u = (value: number) => `${value}cqw`;

export function LetterSheet({
  data,
  design,
  thumbnail = false,
}: {
  data: LetterSheetData;
  design: Pick<LetterDesign, "template" | "color" | "photo">;
  /** A small sheet: A4 height, the text cut at the bottom, hidden from screen readers. */
  thumbnail?: boolean;
}) {
  const layout = letterLayouts[design.template];
  const color = colorHex(design.color);
  const light = tint(color, 0.88);
  // On the band: the family name and the photo ring in a light shade of the colour (lettre modèle).
  const accent = tint(color, 0.62);
  const name = nameParts(data.name);
  const withPhoto = design.photo !== "aucune";
  const size = layout.photoSize;
  const strip = layout.coord === "strip-white" || layout.coord === "strip-tint";

  const photo = withPhoto ? (
    <span
      className="lm-photo"
      style={{
        width: u(size),
        height: u(size),
        borderRadius: design.photo === "rond" ? "50%" : u(2),
        border: `${u(0.6)} solid ${accent}`,
        fontSize: u(size * 0.36),
        background: tint(color, 0.75),
        color,
      }}
    >
      {data.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- the person's own photo, already small
        <img src={data.photoUrl} alt="" />
      ) : (
        data.initials
      )}
    </span>
  ) : null;

  const contacts = (onColor: boolean, style?: CSSProperties) =>
    data.contacts.length > 0 ? (
      <ul
        className="lm-coord"
        style={{
          fontSize: u(U.coord),
          color: onColor ? "rgba(255,255,255,0.92)" : color,
          flexDirection: layout.coord === "column" ? "column" : "row",
          gap: layout.coord === "column" ? u(0.6) : `${u(0.4)} 0`,
          justifyContent: layout.center ? "center" : "flex-start",
          ...style,
        }}
      >
        {data.contacts.map((item, index) => (
          <li key={item}>
            {index > 0 && layout.coord !== "column" ? <span aria-hidden>{"\u00a0· "}</span> : null}
            {item}
          </li>
        ))}
      </ul>
    ) : null;

  const identity = (
    <div
      className="lm-id"
      style={{
        alignItems: layout.center ? "center" : "flex-start",
        textAlign: layout.center ? "center" : "left",
      }}
    >
      <p className="lm-nom" style={{ fontSize: u(U.name) }}>
        {name.first}
        {name.last ? <span style={{ color: accent }}> {name.last}</span> : null}
      </p>
      {data.headline && (
        <p className="lm-titre" style={{ fontSize: u(U.headline), marginTop: u(0.8) }}>
          {data.headline}
        </p>
      )}
      {!strip && contacts(true, { marginTop: u(1.6) })}
    </div>
  );

  const bandPadding = layout.inset
    ? `${u(U.bandY - 1)} ${u(U.padX - U.inset + 1)}`
    : `${u(U.bandY)} ${u(U.padX)} ${strip ? 0 : u(U.bandY)}`;

  return (
    <div
      className="lm"
      data-vignette={thumbnail ? "" : undefined}
      aria-hidden={thumbnail || undefined}
    >
      <div className="lm-in">
        <header
          className="lm-band"
          style={{
            background: color,
            padding: bandPadding,
            margin: layout.inset ? `${u(U.inset)} ${u(U.inset)} 0` : 0,
            borderRadius: layout.inset ? u(U.radius) : 0,
          }}
        >
          <div
            className="lm-band-l"
            style={{
              flexDirection: layout.photo === "top" ? "column" : "row",
              alignItems: "center",
              justifyContent: layout.photo === "right" ? "space-between" : "flex-start",
              gap: u(layout.photo === "top" ? 2.4 : 4.5),
            }}
          >
            {(layout.photo === "left" || layout.photo === "top") && photo}
            {identity}
            {layout.photo === "right" && photo}
          </div>
          {strip &&
            contacts(false, {
              margin: `${u(4)} ${u(-U.padX)} 0`,
              padding: `${u(2.2)} ${u(U.padX)}`,
              background: layout.coord === "strip-tint" ? light : "#fff",
              borderBottom: layout.coord === "strip-white" ? `${u(0.25)} solid ${light}` : "none",
            })}
        </header>

        <div
          className="lm-corps"
          style={{
            margin: `${u(6)} ${u(U.padX)} ${u(8)}`,
            fontSize: u(U.body),
            ...(layout.rule ? { borderLeft: `${u(0.6)} solid ${color}`, paddingLeft: u(4) } : null),
          }}
        >
          {data.recipient && (
            <div
              className="lm-dest"
              style={{
                borderLeft: `${u(0.6)} solid ${color}`,
                background: tint(color, 0.93),
                padding: `${u(1.6)} ${u(2.6)}`,
                marginBottom: u(1.5),
              }}
            >
              <b>{data.recipient.to}</b>
              <span>{data.recipient.detail}</span>
            </div>
          )}
          <p
            className="lm-date"
            style={{ fontSize: u(U.date), color, marginBottom: u(data.recipient ? 3 : 4) }}
          >
            {data.date}
          </p>
          <h2
            className="lm-h"
            style={{
              fontSize: u(U.heading),
              color,
              textAlign: layout.center ? "center" : "left",
              marginBottom: u(data.subject ? 2 : 3.6),
              ...(layout.heading === "underline"
                ? { paddingBottom: u(1.2), borderBottom: `${u(0.3)} solid ${light}` }
                : null),
              ...(layout.heading === "pill"
                ? {
                    alignSelf: "flex-start",
                    background: light,
                    padding: `${u(1)} ${u(2.4)}`,
                    borderRadius: u(4),
                  }
                : null),
            }}
          >
            {data.heading}
          </h2>
          {data.subject && (
            <p className="lm-objet" style={{ marginBottom: u(3.6) }}>
              <span style={{ color }}>{data.subjectLabel}</span> {data.subject}
            </p>
          )}
          {paragraphsOf(data.text).map((paragraph, index) => (
            <p key={index} className="lm-p" style={{ marginBottom: u(U.gap) }}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
