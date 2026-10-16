import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { Badge, ProgressBar } from "@/components/ui";
import { durationParts } from "@/lib/format";
import type { PathSummary } from "@/server/services/learn-paths";

/** A learning path in the Explorer (Learn v2, étape 2), with the learner's progress when followed. */
export async function PathCard({
  path,
  progress,
}: {
  path: PathSummary;
  progress?: { done: number; total: number; percent: number };
}) {
  const t = await getTranslations();
  const duration = durationParts(path.durationMinutes);
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-[22px] border border-sapin/8 bg-blanc p-4 lg:p-5">
      <p className="flex flex-wrap gap-2">
        <Badge tone="lime" icon={<Icon name="objectif" />}>
          {t("learn.catalog.paths.label")}
        </Badge>
        {path.domain && <Badge tone="neutral">{path.domain.name}</Badge>}
        {path.editorialLine !== "originals" && (
          <Badge tone="sapin">{t(`learn.editorial.${path.editorialLine}`)}</Badge>
        )}
      </p>
      <h3 className="text-[17px] leading-snug font-semibold">
        <Link
          href={`/app/learn/parcours/${path.slug}`}
          className="after:absolute after:inset-0 after:rounded-[22px] hover:underline"
        >
          {path.title}
        </Link>
      </h3>
      {path.summary && <p className="line-clamp-2 text-[13.5px] text-ardoise">{path.summary}</p>}
      <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ardoise">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="learn" className="size-4 text-feuille" />
          {t("learn.catalog.paths.courses", { count: path.courseCount })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="horloge" className="size-4 text-feuille" />
          {t(`ui.duration.${duration.key}`, duration.values)}
        </span>
      </p>
      {progress && (
        <div className="flex items-center gap-2 text-xs font-semibold">
          <ProgressBar
            value={progress.percent}
            tone="feuille"
            label={t("learn.paths.followed.progress", progress)}
          />
          <span className="shrink-0">{t("learn.paths.followed.progress", progress)}</span>
        </div>
      )}
    </article>
  );
}
