/**
 * One CV, as HTML (SPECIFICATION-MODELES-CV.md § 6.1): the markup of docs/modeles-cv/modeles/html,
 * the same for the 15 templates; only the stylesheet and the configuration change. The whole CV
 * is rendered once in `.cv-source` (hidden), then `paginate` pours it into A4 pages. The same
 * component serves the preview and the PDF export: what is seen is what is downloaded.
 *
 * Markup names (classes, data-*) are those of the reference stylesheets, in French.
 */
import type { CSSProperties, ReactNode } from "react";
import "../templates/fonts.css";
import "../templates/base.css";
import "../templates/classique.css";
import "../templates/epure.css";
import "../templates/premier-emploi.css";
import "../templates/moderne.css";
import "../templates/colonne.css";
import "../templates/executif.css";
import "../templates/bandeau.css";
import "../templates/contraste.css";
import "../templates/parcours.css";
import "../templates/compact.css";
import "../templates/academique.css";
import "../templates/creatif.css";
import "../templates/tech.css";
import "../templates/elegant.css";
import "../templates/visuel.css";
import "../templates/prestige.css";
import { accentHex, fontOf } from "./palette";
import type { CvDocumentBlock, CvDocumentData, CvDocumentItem } from "./model";
import { blockLayout, MAX_PAGES, type CvStyle } from "../style";
import {
  blockMarkup,
  densityMarkup,
  type CvHeaderBlock,
  type CvTemplate,
  type InterestsPresentation,
  type LanguagesPresentation,
  type SkillsPresentation,
} from "../templates/registry";

export type CvDocumentProps = {
  data: CvDocumentData;
  template: CvTemplate;
  style: CvStyle;
  /** Pages allowed before the « trop de pages » alert. */
  maxPages?: number;
};

export function CvDocument({ data, template, style, maxPages = MAX_PAGES }: CvDocumentProps) {
  const photo = template.photo && style.showPhoto && Boolean(data.photoUrl);
  const breaks = new Set(style.pageBreaks ?? []);
  const byType = new Map(data.blocks.map((block) => [block.type, block]));
  const layout = blockLayout(
    template,
    style,
    data.blocks.map((block) => block.type),
  );
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const headerBlocks: Record<CvHeaderBlock, ReactNode> = {
    identity: (
      <div className="cv-identite">
        <h1 className="cv-nom">
          <span className="prenom">{data.firstName}</span>{" "}
          <span className="nom">{data.lastName}</span>
        </h1>
        {data.headline && <p className="cv-titre">{data.headline}</p>}
      </div>
    ),
    contact:
      data.contact.length > 0 ? (
        <ul className="cv-contact">
          {data.contact.map((line, index) => (
            <li key={index}>
              {line.label && (
                <>
                  <span className="lib">{line.label}</span>{" "}
                </>
              )}
              {line.value}
            </li>
          ))}
        </ul>
      ) : null,
    photo: photo ? (
      <div className="cv-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- printed as is, no optimisation */}
        <img src={data.photoUrl} alt="" />
      </div>
    ) : template.id === "creatif" && template.photo ? (
      <div className="cv-mono" aria-hidden>
        {initials(data)}
      </div>
    ) : null,
  };
  const head = (blocks: readonly CvHeaderBlock[], target: string) =>
    blocks.map((name) =>
      headerBlocks[name] ? (
        <div key={`${target}-${name}`} style={{ display: "contents" }} data-bloc-tete={target}>
          {headerBlocks[name]}
        </div>
      ) : null,
    );
  const articleStyle = {
    "--cv-accent": accentHex(style.accent) ?? accentHex(template.accent),
    "--cv-police": `'${fontOf(style.font).family}'`,
  } as CSSProperties;

  return (
    <article
      className={[
        "cv",
        `tpl-${template.id}`,
        `d-${densityMarkup[style.density]}`,
        photo ? "photo-on" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      lang={data.language}
      data-modele={template.id}
      data-max-pages={maxPages}
      style={articleStyle}
    >
      <div className="cv-source">
        {head(template.header, ".cv-tete")}
        {head(template.sideHeader, ".cv-lat-tete")}
        {layout.map(({ type, zone }, index) => {
          const block = byType.get(type);
          return block ? (
            <Section
              key={block.id}
              block={block}
              template={template}
              zone={zone === "side" ? "lateral" : "principal"}
              number={index + 1}
              breaks={breaks}
            />
          ) : null;
        })}
      </div>
      <div className="cv-page-modele">
        <div className="cv-page">
          <div className="cv-deco" />
          <header className="cv-tete" data-page1="" />
          <div className="cv-tete-suite">
            <span>{fullName}</span>
            <span>{data.headline}</span>
          </div>
          <main className="cv-principal" />
          <aside className="cv-lateral">
            {template.sideHeader.length > 0 && <div className="cv-lat-tete" data-page1="" />}
          </aside>
          <footer className="cv-pied" />
        </div>
      </div>
      <div className="cv-pages" />
    </article>
  );
}

function initials(data: CvDocumentData) {
  return [data.firstName, data.lastName]
    .map((name) => name.trim().charAt(0))
    .join("")
    .toUpperCase();
}

function Section({
  block,
  template,
  zone,
  number,
  breaks,
}: {
  block: CvDocumentBlock;
  template: CvTemplate;
  zone: "principal" | "lateral";
  number: number;
  breaks: Set<string>;
}) {
  const markup = blockMarkup[block.type];
  const num = `${number}. `;
  return (
    <section
      className={`cv-sec sec-${markup}`}
      data-zone={zone}
      data-type={markup}
      data-id={block.id}
      data-saut={breaks.has(block.id) ? "avant" : undefined}
    >
      <h2 className="cv-st">
        <span className="num">{num}</span>
        {block.title}
      </h2>
      <SectionBody block={block} template={template} breaks={breaks} />
    </section>
  );
}

function SectionBody({
  block,
  template,
  breaks,
}: {
  block: CvDocumentBlock;
  template: CvTemplate;
  breaks: Set<string>;
}) {
  switch (block.type) {
    case "summary":
      return (
        <div className="cv-el">
          <p className="cv-texte">{block.text}</p>
        </div>
      );
    case "highlights":
      return (
        <div className="cv-el">
          <ul className="cv-puces">
            {block.bullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        </div>
      );
    case "skills":
      return (
        <div className="cv-el">
          <Skills skills={block.skills} presentation={template.skills} />
        </div>
      );
    case "languages":
      return (
        <div className="cv-el">
          <Languages languages={block.languages} presentation={template.languages} />
        </div>
      );
    case "interests":
      return (
        <div className="cv-el">
          <ul className={interestClass[template.interests]}>
            {block.names.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
      );
    case "publications":
    case "talks":
      return block.references.map((item, index) => (
        <div
          key={item.id}
          className="cv-el"
          data-id={item.id}
          data-saut={breaks.has(item.id) ? "avant" : undefined}
        >
          <ol className="cv-refs" start={index + 1} style={{ counterReset: `ref ${index}` }}>
            <li>{item.title}</li>
          </ol>
        </div>
      ));
    case "certificates":
      return block.items.map((item) => (
        <div
          key={item.id}
          className="cv-el"
          data-id={item.id}
          data-saut={breaks.has(item.id) ? "avant" : undefined}
        >
          <div className="cv-it-tete">
            <h3 className="cv-it-titre" style={{ fontSize: "1em" }}>
              {item.title}
            </h3>
            <span className="cv-it-date">{item.period ?? ""}</span>
          </div>
          <p className="cv-it-sous" style={{ fontWeight: 400 }}>
            {item.subtitle ?? ""}
          </p>
        </div>
      ));
    default:
      return block.items.map((item) => <Item key={item.id} item={item} breaks={breaks} />);
  }
}

function Item({ item, breaks }: { item: CvDocumentItem; breaks: Set<string> }) {
  return (
    <div className="cv-el" data-id={item.id} data-saut={breaks.has(item.id) ? "avant" : undefined}>
      <div className="cv-it-tete">
        <h3 className="cv-it-titre">{item.title}</h3>
        {item.period && <span className="cv-it-date">{item.period}</span>}
      </div>
      {item.subtitle && <p className="cv-it-sous">{item.subtitle}</p>}
      {item.text && <p className="cv-it-texte">{item.text}</p>}
      {item.tools && <p className="cv-it-outils">{item.tools}</p>}
      {item.bullets && item.bullets.length > 0 && (
        <ul className="cv-puces">
          {item.bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const skillClass: Record<SkillsPresentation, string> = {
  line: "cv-ligne",
  levelList: "cv-liste-niveau",
  chips: "cv-chips",
  grid: "cv-grille",
  bars: "cv-barres",
  dots: "cv-points",
  groups: "cv-groupes",
};

const languageClass: Record<LanguagesPresentation, string> = {
  line: "cv-ligne",
  levelList: "cv-liste-niveau",
  list: "cv-liste",
  dots: "cv-points",
};

const interestClass: Record<InterestsPresentation, string> = {
  line: "cv-ligne",
  chips: "cv-chips",
  list: "cv-liste",
};

/** Levels are always written: hidden visually (`.sr`) when drawn as a gauge or dots (§ 7). */
function Skills({
  skills,
  presentation,
}: {
  skills: Extract<CvDocumentBlock, { type: "skills" }>["skills"];
  presentation: SkillsPresentation;
}) {
  if (presentation === "groups") {
    const groups = new Map<string, typeof skills>();
    for (const skill of skills) {
      const key = skill.group ?? "";
      groups.set(key, [...(groups.get(key) ?? []), skill]);
    }
    return (
      <div className="cv-groupes">
        {[...groups].map(([group, items]) => (
          <div key={group} className="grp">
            <span>{group}</span>
            <ul className="cv-chips">
              {items.map((skill, index) => (
                <li key={index}>
                  {skill.name}
                  <span className="sr">{inParentheses(skill.levelLabel)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul className={skillClass[presentation]}>
      {skills.map((skill, index) => {
        if (presentation === "bars") {
          return (
            <li key={index}>
              <span>{skill.name}</span>
              <span className="niv">{skill.levelLabel}</span>
              <span className="jauge" aria-hidden>
                <i style={{ width: `${skill.level * 25}%` }} />
              </span>
            </li>
          );
        }
        if (presentation === "dots") {
          return (
            <li key={index}>
              <span>{skill.name}</span>
              <Dots count={skill.level} />
              <span className="niv sr">{skill.levelLabel}</span>
            </li>
          );
        }
        if (presentation === "chips") {
          return (
            <li key={index}>
              {skill.name}
              <span className="sr">{inParentheses(skill.levelLabel)}</span>
            </li>
          );
        }
        return (
          <li key={index}>
            <span>{skill.name}</span> <span className="niv">{skill.levelLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Languages({
  languages,
  presentation,
}: {
  languages: Extract<CvDocumentBlock, { type: "languages" }>["languages"];
  presentation: LanguagesPresentation;
}) {
  return (
    <ul className={languageClass[presentation]}>
      {languages.map((language, index) => {
        if (presentation === "dots") {
          return (
            <li key={index}>
              <span>{language.name}</span>
              <Dots count={language.dots} />
              <span className="niv">{language.levelLabel}</span>
            </li>
          );
        }
        if (presentation === "list") {
          return (
            <li key={index}>
              <b style={{ fontWeight: 600 }}>{language.name}</b>
              {" · "}
              {language.levelLabel}
            </li>
          );
        }
        return (
          <li key={index}>
            <span>{language.name}</span> <span className="niv">{language.levelLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Dots({ count }: { count: number }) {
  return (
    <span className="pts" aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <b key={index} className={index < count ? "" : "off"} />
      ))}
    </span>
  );
}

/** « (Avancé) », read after a skill whose level is only drawn (§ 7). */
function inParentheses(text: string) {
  return ` (${text})`;
}
