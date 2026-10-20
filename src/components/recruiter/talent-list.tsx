"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export type TalentCard = {
  profileId: string;
  /** Name, or « Profil anonyme · headline » until the talent applies or accepts. */
  title: string;
  initials: string;
  tone: string;
  line: string;
  score: number | null;
  skills: string[];
  href: string;
};

/**
 * « Découvrir » (planche r2plus TAL): one continuous list, the next profiles load by themselves
 * when the end comes into view (no pages to choose); « Consulter » on each card. The number of
 * pages of one search stays capped (partie 10 § 10.3): at the end, the list says to refine it.
 */
export function TalentList({
  initial,
  more: initialMore,
  load,
}: {
  initial: TalentCard[];
  more: boolean;
  load: (page: number) => Promise<{ cards: TalentCard[]; more: boolean } | null>;
}) {
  const t = useTranslations("hireTalents.list");
  const [cards, setCards] = useState(initial);
  const [more, setMore] = useState(initialMore);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  const next = () => {
    if (pending || !more) return;
    start(async () => {
      const result = await load(page + 1).catch(() => null);
      if (!result) {
        setFailed(true);
        return;
      }
      setFailed(false);
      setPage(page + 1);
      setCards((current) => {
        const known = new Set(current.map((card) => card.profileId));
        return [...current, ...result.cards.filter((card) => !known.has(card.profileId))];
      });
      setMore(result.more);
    });
  };

  useEffect(() => {
    const node = end.current;
    if (!node || !more || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) next();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  });

  return (
    <>
      <ul className="t-ri-tls">
        {cards.map((card) => (
          <li key={card.profileId} className="t-verre t-ri-tl">
            <div className="t-h">
              <span className={cx("t-rc-av", card.tone)} aria-hidden>
                {card.initials}
              </span>
              <span className="t-t">
                <b>{card.title}</b>
                <span>{card.line}</span>
              </span>
              {card.score !== null && (
                <span className="t-ri-sc">
                  <b aria-hidden>{t("percent", { value: card.score })}</b>
                  <span aria-hidden>{t("withOffer")}</span>
                  <span className="sr-only">{t("scoreAria", { score: card.score })}</span>
                </span>
              )}
            </div>
            <div className="t-b2">
              <span className="t-m">
                {card.skills.map((skill) => (
                  <span key={skill} className="t-ri-tag">
                    {skill}
                  </span>
                ))}
              </span>
              <Link
                href={card.href}
                className="t-bt t-s t-ri-consulter t-press"
                aria-label={t("openAria", { name: card.title })}
              >
                {t("open")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <div ref={end} className="t-ri-suite" aria-live="polite">
        {more && !failed && (
          <>
            <span className="t-spin" aria-hidden />
            {t("loading")}
          </>
        )}
        {more && failed && (
          <button type="button" onClick={next} className="t-bt t-sec t-s t-press">
            {t("retry")}
          </button>
        )}
        {!more && cards.length > 0 && <span>{t("end")}</span>}
      </div>
    </>
  );
}
