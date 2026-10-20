import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { cx } from "@/lib/cx";
import type { AtsRow, Bar } from "@/server/services/hire-ats";
import { avatarTone, initialsOf } from "./candidates";

/** Three rings in the corner of the dark cards (planche `_RINGS`), decorative. */
export function AtsRings() {
  return (
    <svg className="t-r6-rings" viewBox="0 0 180 180" fill="none" aria-hidden>
      <circle cx="90" cy="90" r="30" />
      <circle cx="90" cy="90" r="55" />
      <circle cx="90" cy="90" r="80" />
    </svg>
  );
}

/** A small pile of files with their number (planche `.a2-docs`). */
export function AtsDocs({ count }: { count: number }) {
  return (
    <span className="t-r6-docs" aria-hidden>
      <i />
      <i />
      <i />
      <b>{count > 99 ? "99+" : count}</b>
    </span>
  );
}

/**
 * The ATS card of the other screens (planche 0 bis `e_ats`): Mes offres, Candidats, À traiter. Its
 * button is always called « Analyser… » and only opens the ATS: nothing starts without the member.
 */
export async function AtsEntry({
  title,
  text,
  cta,
  href,
  count,
  chips = [],
}: {
  title: string;
  text: string;
  cta: string;
  href: string;
  count: number;
  chips?: string[];
}) {
  const t = await getTranslations("hireAts");
  return (
    <section className="t-r6-entry" aria-label={t("entry.aria")}>
      <AtsRings />
      <span className="t-r6-tg">
        <OrbiMark size={16} />
        {t("entry.tag")}
      </span>
      <div className="t-r">
        <AtsDocs count={count} />
        <div className="t-t">
          <b>{title}</b>
          {text}
        </div>
      </div>
      {chips.length > 0 && (
        <div className="t-r6-ln">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      )}
      <Link href={href} className="t-bt t-pl t-press">
        <OrbiMark size={20} />
        {cta}
      </Link>
    </section>
  );
}

function Bars({
  bars,
  labels,
}: {
  bars: AtsRow["bars"];
  labels: { skills: string; experience: string; proofs: string; aria: string };
}) {
  const one = (label: string, bar: Bar) => (
    <div>
      {label}
      <i aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <u key={index} className={cx(index < bar.value && (bar.check ? "t-am" : "t-on"))} />
        ))}
      </i>
    </div>
  );
  return (
    <div className="t-r6-bars" role="img" aria-label={labels.aria}>
      {one(labels.skills, bars.skills)}
      {one(labels.experience, bars.experience)}
      {one(labels.proofs, bars.proofs)}
    </div>
  );
}

/** Score in a ring « sur 100 » (planche `.a2-sc`), a landmark, never a decision. */
export function AtsScore({ score, label, small }: { score: number; label: string; small: string }) {
  return (
    <span className="t-r6-sc" role="img" aria-label={label}>
      <span className="t-rg" style={{ "--p": score } as CSSProperties}>
        <b aria-hidden>{score}</b>
      </span>
      <small aria-hidden>{small}</small>
    </span>
  );
}

/**
 * A ranked application (planche v4.1 `rc`): its rank on the avatar, the name and its line, the
 * score ring, the three bars, the facts proven or to check, « Pourquoi ? » and the badges.
 */
export async function AtsCard({
  row,
  rank,
  href,
  whyHref,
  mini,
  check,
  line,
}: {
  row: AtsRow;
  rank: number;
  href: string;
  whyHref: string;
  mini?: boolean;
  /** Selection mode: the checkbox in place of nothing. */
  check?: ReactNode;
  line: string;
}) {
  const t = await getTranslations("hireAts");
  return (
    <article
      className={cx("t-r6-c", rank <= 3 && `t-r${rank}`, mini && "t-mini")}
      aria-labelledby={`ats-${row.id}`}
    >
      <div className="t-h">
        {check}
        <span className="t-avw">
          <span className={cx("t-rc-av", avatarTone(row.id))} aria-hidden>
            {initialsOf(row.name)}
          </span>
          <span className="t-r6-md" aria-hidden>
            {rank}
          </span>
        </span>
        <div className="t-t">
          <b>
            <Link id={`ats-${row.id}`} href={href} className="t-r6-nom">
              <span className="sr-only">{t("card.rank", { rank })} </span>
              {row.name}
            </Link>
            {row.shortlisted && <span className="t-r6-ret">{t("card.shortlisted")}</span>}
            {row.status !== "active" && (
              <span className="t-r6-ret t-off">{t(`card.status.${row.status as "hired"}`)}</span>
            )}
          </b>
          <span>{line}</span>
        </div>
        {row.score !== null ? (
          <AtsScore
            score={row.score}
            small={t("card.outOf")}
            label={t("card.scoreAria", { score: row.score })}
          />
        ) : (
          <span className="t-r6-nosc">{t("card.noScore")}</span>
        )}
      </div>
      {!mini && (
        <>
          <Bars
            bars={row.bars}
            labels={{
              skills: t("card.bars.skills"),
              experience: t("card.bars.experience"),
              proofs: t("card.bars.proofs"),
              aria: t("card.bars.aria", {
                skills: row.bars.skills.value,
                experience: row.bars.experience.value,
                proofs: row.bars.proofs.value,
              }),
            }}
          />
          <div className="t-r6-f">
            {row.facts.map((fact) => (
              <em key={fact.skill} className={cx(!fact.proven && "t-a")}>
                {fact.proven ? fact.skill : t("card.toCheck", { skill: fact.skill })}
              </em>
            ))}
            <Link href={whyHref} className="t-r6-pq t-press">
              <TalentIcon name="pourquoi" size="xs" />
              {t("card.why")}
              <span className="sr-only">{t("card.whyAria", { name: row.name })}</span>
            </Link>
          </div>
        </>
      )}
    </article>
  );
}

/** The podium of the three first (planche ATS3 `.a2-pod`): second, first with a crown, third. */
export async function AtsPodium({ rows, line }: { rows: AtsRow[]; line: (row: AtsRow) => string }) {
  const t = await getTranslations("hireAts");
  const order = [rows[1], rows[0], rows[2]];
  return (
    <ol className="t-r6-pod" aria-label={t("reco.podium")}>
      {order.map((row, index) => {
        if (!row) return <li key={index} aria-hidden className="t-r6-pv" />;
        const rank = rows.indexOf(row) + 1;
        return (
          <li key={row.id} className={`t-c${rank}`} value={rank}>
            {rank === 1 && (
              <span className="t-r6-crown" aria-hidden>
                <svg viewBox="0 0 22 16">
                  <path d="M2 14 L4 4 L8 9 L11 2 L14 9 L18 4 L20 14 Z" fill="currentColor" />
                </svg>
              </span>
            )}
            <span className={cx("t-rc-av", avatarTone(row.id))} aria-hidden>
              {initialsOf(row.name)}
            </span>
            <b>{row.name}</b>
            <small>{line(row)}</small>
            <span className="t-r6-st" aria-hidden>
              {rank}
              {row.score !== null && <small>{row.score}</small>}
            </span>
            <span className="sr-only">
              {row.score !== null
                ? t("reco.placeScore", { rank, score: row.score })
                : t("reco.place", { rank })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
