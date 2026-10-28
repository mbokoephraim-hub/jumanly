import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { initials } from "@/components/ui/avatar";
import { cx } from "@/lib/cx";

/**
 * Previews of the app drawn in HTML for the public site, like the Modèle B site mockup
 * (docs/modele-b-recruteur/web/captures/001-Web-Site.jpg): a dark window, three dots, a title and
 * the content. Manifestly fictional examples (textes « sitePreview »), described by `label`.
 */
export function AppWindow({
  title,
  label,
  className,
  children,
}: {
  title: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={cx(
        "rounded-[22px] bg-nuit p-4 shadow-[0_40px_80px_rgba(0,0,0,0.45)] ring-1 ring-blanc/8 ring-inset lg:p-5",
        className,
      )}
    >
      <div aria-hidden className="flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2.5 rounded-full bg-blanc/15" />
        ))}
      </div>
      <p aria-hidden className="mt-4 text-[15px] leading-5 font-semibold">
        {title}
      </p>
      <div aria-hidden className="mt-4">
        {children}
      </div>
    </figure>
  );
}

function ScoreBadge({ value }: { value: string }) {
  return (
    <span className="rounded-[6px] bg-lime px-1.5 py-0.5 text-[11px] leading-4 font-bold text-sapin">
      {value}
    </span>
  );
}

/** A candidate card of the pipeline: initials, name, score and « Pourquoi ? ». */
function CandidateCard({ name, score, why }: { name: string; score: string; why: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-blanc/6 p-3">
      <span className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#e9f4e4] text-[10px] font-bold text-[#0f3f37]">
          {initials(name)}
        </span>
        <span className="truncate text-[13px] font-semibold">{name}</span>
      </span>
      <span className="flex items-center justify-between gap-2">
        <ScoreBadge value={score} />
        <span className="text-[11px] font-semibold text-lime">{why}</span>
      </span>
    </div>
  );
}

/** The Hire pipeline of an offer: three columns of scored applications. */
export async function PipelinePreview({ label, className }: { label: string; className?: string }) {
  const t = await getTranslations();
  const why = t("common.why");
  const score = (value: number) => t("sitePreview.score", { value });
  const columns = [
    {
      key: "new",
      cards: [
        ["c1", 85],
        ["c4", 74],
      ],
    },
    { key: "shortlisted", cards: [["c2", 82]] },
    { key: "interview", cards: [["c3", 93]] },
  ] as const;
  return (
    <AppWindow title={t("sitePreview.pipeline.title")} label={label} className={className}>
      <div className="grid grid-cols-3 gap-2.5">
        {columns.map((column) => (
          <div key={column.key} className="flex min-w-0 flex-col gap-2.5">
            <span className="text-[11px] font-semibold text-ardoise">
              {t(`sitePreview.pipeline.${column.key}`)}
            </span>
            {column.cards.map(([name, value]) => (
              <CandidateCard
                key={name}
                name={t(`sitePreview.pipeline.${name}`)}
                score={score(value)}
                why={why}
              />
            ))}
          </div>
        ))}
      </div>
    </AppWindow>
  );
}

/** The offers that match a talent's profile, with their score and « Pourquoi ? ». */
export async function MatchesPreview({ label, className }: { label: string; className?: string }) {
  const t = await getTranslations();
  const offers = [
    { key: "1", value: 87 },
    { key: "2", value: 82 },
    { key: "3", value: 74 },
  ] as const;
  return (
    <AppWindow title={t("sitePreview.matches.title")} label={label} className={className}>
      <ul className="flex flex-col gap-2.5">
        {offers.map((offer, index) => (
          <li key={offer.key} className="flex items-center gap-3 rounded-[14px] bg-blanc/6 p-3">
            {index === 0 ? (
              <AiOrb size={32} />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1c3a2c] text-lime">
                <Icon name="jobs" className="size-4" />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-semibold">
                {t(`sitePreview.matches.job${offer.key}`)}
              </span>
              <span className="truncate text-[11px] text-ardoise">
                {t(`sitePreview.matches.company${offer.key}`)}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <ScoreBadge value={t("sitePreview.score", { value: offer.value })} />
              <span className="text-[11px] font-semibold text-lime">{t("common.why")}</span>
            </span>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}
