"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition, type ComponentProps } from "react";
import { showToast } from "@/components/motion/toaster";
import { reorderCvSections } from "@/server/actions/cv";
import {
  decideCvSummaryAction,
  rewriteCvSummaryAction,
  saveCvSummaryAction,
  toggleCvSectionAction,
} from "@/server/actions/cv-flow";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CvFrame } from "./frame";
import { OrbiSpark } from "./marks";

export type ContentSection = {
  key: "experience" | "education" | "skills" | "languages";
  name: string;
  count: number;
  visible: boolean;
  color: string;
  href: string;
  experiences?: { title: string; company: string; color: string; bullets: string[] }[];
  chips?: { text: string; color: string }[];
  lines?: string[];
};

/** Moves `from` to `to` in a list. */
function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/**
 * Contenu (capture 09): Orbi filled the CV from the profile. The summary (« Réécrire avec Orbi »
 * proposes, the person keeps or refuses), then the sections: a switch shows or hides each one,
 * the handle changes their order (drag, or the arrow keys on the handle), a touch on a block
 * opens its editor.
 */
export function CvContentStep({
  cvId,
  summary,
  suggestion: initialSuggestion,
  contact,
  sections: initialSections,
  order,
  steps,
}: {
  cvId: string;
  summary: string;
  suggestion: { id: string; text: string } | null;
  contact: { line: string; href: string };
  sections: ContentSection[];
  /** Every block of the CV in its order (the summary included), as `reorderCvSections` wants. */
  order: string[];
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [suggestion, setSuggestion] = useState(initialSuggestion);
  const [editing, setEditing] = useState(false);
  const [more, setMore] = useState(false);
  const [draft, setDraft] = useState(summary);
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState<number | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const live = useRef<HTMLParagraphElement>(null);

  const fail = () => showToast({ message: t("error"), tone: "error" });

  const commit = (next: ContentSection[]) => {
    const keys = next.map((section) => section.key as string);
    // The summary keeps its place; the other blocks take the new order around it.
    const full = [...order];
    const slots = full.map((key, index) => (keys.includes(key) ? index : -1)).filter((i) => i >= 0);
    slots.forEach((slot, index) => (full[slot] = keys[index]!));
    start(async () => {
      const result = await reorderCvSections(cvId, full);
      if (!result.ok) fail();
    });
  };

  const shift = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    const next = move(sections, from, to);
    setSections(next);
    if (live.current)
      live.current.textContent = t("content.moved", {
        name: sections[from]!.name,
        place: to + 1,
        all: sections.length,
      });
    commit(next);
  };

  // Drag by the handle: the row follows the finger, the others make room, the order is saved
  // when the finger lifts.
  const drag = (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rows = [...(list.current?.children ?? [])] as HTMLElement[];
    const middles = rows.map((row) => {
      const box = row.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    let target = index;
    setDragging(index);
    const onMove = (moveEvent: PointerEvent) => {
      const y = moveEvent.clientY;
      target = middles.filter((middle, position) => position !== index && middle < y).length;
      rows.forEach((row, position) => {
        row.style.transform =
          position === index
            ? `translateY(${y - middles[index]!}px)`
            : index < position && position <= target
              ? `translateY(-12px)`
              : target <= position && position < index
                ? `translateY(12px)`
                : "";
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      rows.forEach((row) => (row.style.transform = ""));
      setDragging(null);
      shift(index, target);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const toggle = (key: ContentSection["key"]) => {
    setSections((list) =>
      list.map((section) =>
        section.key === key ? { ...section, visible: !section.visible } : section,
      ),
    );
    start(async () => {
      const result = await toggleCvSectionAction(cvId, key);
      if (!result.ok) fail();
    });
  };

  const rewrite = () =>
    start(async () => {
      const result = await rewriteCvSummaryAction(cvId);
      if (result.ok) setSuggestion(result.suggestion);
      else
        showToast({
          message: t.has(`content.orbiError.${result.error}` as "content.orbiError.same")
            ? t(`content.orbiError.${result.error}` as "content.orbiError.same")
            : t("error"),
          tone: "error",
        });
    });

  const decide = (decision: "applied" | "ignored") => {
    if (!suggestion) return;
    start(async () => {
      const result = await decideCvSummaryAction({ suggestion: suggestion.id, decision });
      setSuggestion(null);
      if (!result.ok) return fail();
      showToast({ message: decision === "applied" ? t("content.kept") : t("content.refused") });
      router.refresh();
    });
  };

  const hidden = sections.filter((section) => !section.visible);
  return (
    <CvFrame
      title={t("content.title")}
      sub={t("content.sub")}
      back={{ href: steps?.hrefs.modele ?? "/app/career/cv", label: t("back") }}
      steps={steps}
      bottom={
        <Link
          href={`/app/career/cv/${cvId}?etape=style`}
          className="nb-bouton nb-cv-principal"
          data-plein=""
          data-large=""
        >
          {t("continue")}
        </Link>
      }
    >
      <div className="nb-cv-orbi">
        <span className="nb-cv-orbi-i" aria-hidden>
          <OrbiSpark size={18} />
        </span>
        <p>
          <b>{t("content.orbiTitle")}</b> {t("content.orbiText")}
        </p>
      </div>

      <div className="nb-cv-h" data-action="">
        <h2>{t("content.summary")}</h2>
        <button type="button" onClick={rewrite} disabled={pending}>
          <OrbiSpark size={13} />
          {t("content.rewrite")}
        </button>
      </div>
      {suggestion ? (
        <div className="nb-cv-resume" data-orbi="" role="group" aria-label={t("content.proposal")}>
          <small>{t("content.proposal")}</small>
          <p>{suggestion.text}</p>
          <div className="nb-cv-deux">
            <button
              type="button"
              className="nb-bouton"
              data-contour=""
              onClick={() => decide("ignored")}
              disabled={pending}
            >
              {t("content.refuse")}
            </button>
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              onClick={() => decide("applied")}
              disabled={pending}
            >
              {t("content.keep")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="nb-cv-resume"
          aria-label={t("content.summaryEdit")}
          onClick={() => {
            setDraft(summary);
            setEditing(true);
          }}
        >
          {summary ? <p>{summary}</p> : <p data-vide="">{t("content.summaryEmpty")}</p>}
        </button>
      )}

      <div className="nb-cv-h">
        <h2>{t("content.sections")}</h2>
        <small>{t("content.dragHint")}</small>
      </div>
      <p ref={live} className="sr-only" aria-live="polite" />
      <Link href={contact.href} className="nb-cv-sec nb-cv-sec-l">
        <span className="nb-cv-sec-h">
          <i className="nb-cv-point" style={{ background: "#A6F26B" }} aria-hidden />
          <b>{t("content.contact")}</b>
          <small>{contact.line}</small>
          <PhoneIcon name="chevron" size={18} />
        </span>
      </Link>
      <ul className="nb-cv-secs" ref={list}>
        {sections.map((section, index) => (
          <li
            key={section.key}
            className="nb-cv-sec"
            data-cache={section.visible ? undefined : ""}
            data-glisse={dragging === index ? "" : undefined}
            style={{ animationDelay: `${0.05 * index}s` }}
          >
            <span className="nb-cv-sec-h">
              <button
                type="button"
                className="nb-cv-poignee"
                aria-label={t("content.handle", { name: section.name })}
                aria-describedby="cv-contenu-poignee"
                onPointerDown={(event) => drag(index, event)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    shift(index, index - 1);
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    shift(index, index + 1);
                  }
                }}
              >
                <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden>
                  {[2, 8, 14].flatMap((y) =>
                    [2, 8].map((x) => (
                      <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" />
                    )),
                  )}
                </svg>
              </button>
              <i className="nb-cv-point" style={{ background: section.color }} aria-hidden />
              <b>{section.name}</b>
              <small>{section.count}</small>
              <button
                type="button"
                role="switch"
                aria-checked={section.visible}
                aria-label={t("content.show", { name: section.name })}
                className="nb-switch"
                onClick={() => toggle(section.key)}
              >
                <span />
              </button>
            </span>
            {section.visible ? (
              <Link
                href={section.href}
                className="nb-cv-sec-c"
                aria-label={t("content.edit", { name: section.name })}
              >
                {section.experiences?.map((item) => (
                  <span
                    key={`${item.title}-${item.company}`}
                    className="nb-cv-xp"
                    style={{ "--c": item.color } as React.CSSProperties}
                  >
                    <b>
                      {item.title}
                      {item.company ? <small> · {item.company}</small> : null}
                    </b>
                    {item.bullets.slice(0, 3).map((bullet) => (
                      <span key={bullet}>{bullet}</span>
                    ))}
                  </span>
                ))}
                {section.chips ? (
                  <span className="nb-cv-puces">
                    {section.chips.map((chip) => (
                      <i key={chip.text} style={{ "--c": chip.color } as React.CSSProperties}>
                        {chip.text}
                      </i>
                    ))}
                  </span>
                ) : null}
                {section.lines?.map((line) => (
                  <span key={line} className="nb-cv-ligne">
                    {line}
                  </span>
                ))}
                {section.count === 0 ? (
                  <span className="nb-cv-ligne" data-vide="">
                    {t("content.emptySection")}
                  </span>
                ) : null}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <p id="cv-contenu-poignee" className="sr-only">
        {t("content.handleHint")}
      </p>
      <button type="button" className="nb-cv-plus" onClick={() => setMore(true)}>
        {t("content.more")}
      </button>

      <PhoneSheet
        open={editing}
        onClose={() => setEditing(false)}
        label={t("content.summary")}
        closeLabel={t("close")}
      >
        <form
          className="nb-cv-feuille-f"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              const result = await saveCvSummaryAction(cvId, draft);
              if (!result.ok) return fail();
              setEditing(false);
              router.refresh();
            });
          }}
        >
          <label htmlFor="cv-contenu-resume" className="nb-cv-feuille-t">
            {t("content.summary")}
          </label>
          <textarea
            id="cv-contenu-resume"
            rows={6}
            maxLength={1000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <small className="nb-cv-aide">{t("content.summaryHint")}</small>
          <button
            type="submit"
            className="nb-bouton"
            data-plein=""
            data-large=""
            disabled={pending}
          >
            {t("save")}
          </button>
        </form>
      </PhoneSheet>

      <PhoneSheet
        open={more}
        onClose={() => setMore(false)}
        label={t("content.moreTitle")}
        closeLabel={t("close")}
      >
        <div className="nb-cv-feuille-f">
          <b className="nb-cv-feuille-t">{t("content.moreTitle")}</b>
          {hidden.length === 0 ? (
            <p className="nb-cv-aide">{t("content.moreNone")}</p>
          ) : (
            hidden.map((section) => (
              <button
                key={section.key}
                type="button"
                className="nb-bouton"
                data-contour=""
                data-large=""
                onClick={() => {
                  toggle(section.key);
                  setMore(false);
                }}
              >
                {t("content.moreAdd", { name: section.name })}
              </button>
            ))
          )}
          <p className="nb-cv-note">{t("content.moreProfile")}</p>
          <Link
            href="/app/career/cv?onglet=profil"
            className="nb-bouton"
            data-contour=""
            data-large=""
          >
            {t("content.moreProfileLink")}
          </Link>
        </div>
      </PhoneSheet>
    </CvFrame>
  );
}
