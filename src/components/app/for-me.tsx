import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Pressable, ProgressBar } from "@/components/ui";
import { cx } from "@/lib/cx";
import { durationParts } from "@/lib/format";
import type { ForMeCourse } from "@/server/services/for-me";

/*
 * Pieces of « Pour moi » (docs/ux-mobile-talent, prompt 3, screens 03-05): a section with its title
 * and one link, the course card of the horizontal row, a row of the action lists.
 */

export function ForMeSection({
  id,
  title,
  link,
  children,
}: {
  id: string;
  title: string;
  link?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-[19px] leading-tight font-semibold tracking-tight">
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            className="flex min-h-11 shrink-0 items-center gap-1 text-[14px] font-semibold text-feuille-fonce"
          >
            {link.label}
            <Icon name="chev-r" className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const coverTones = ["bg-lime", "bg-menthe-claire", "bg-neon"];

/** A course in the horizontal row: cover, category, title, level and duration, progress. */
export async function ForMeCourseCard({ course, index }: { course: ForMeCourse; index: number }) {
  const t = await getTranslations();
  const duration = durationParts(course.durationMinutes);
  const following = course.progress !== null;
  return (
    <article className="relative flex w-[232px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-blanc shadow-douce">
      <div
        aria-hidden
        className={cx(
          "relative flex h-24 items-center justify-center",
          coverTones[index % coverTones.length],
        )}
      >
        {course.free && (
          <span className="absolute top-2.5 left-2.5 rounded-pill bg-blanc px-2.5 py-0.5 text-[11.5px] font-semibold">
            {t("trainings.card.badge.free")}
          </span>
        )}
        <Icon name="cours-video" className="size-7" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="truncate text-[11.5px] font-semibold text-feuille-fonce">{course.category}</p>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">
          <Link
            href={`/app/learn/${course.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {course.title}
          </Link>
        </h3>
        <p className="text-[12.5px] text-ardoise">
          {t(`trainings.filters.level.${course.level}`)}
          {" · "}
          {t(`ui.duration.${duration.key}`, duration.values)}
        </p>
        {following && (
          <div className="mt-1">
            <ProgressBar
              value={course.progress ?? 0}
              label={t("talent.forMe.courses.progress", { percent: course.progress ?? 0 })}
            />
          </div>
        )}
        <p className="mt-auto flex items-center gap-1 pt-2 text-[14px] font-semibold">
          {following ? t("talent.forMe.courses.resume") : t("talent.forMe.courses.discover")}
          {course.open ? (
            <Icon name="chev-r" className="size-4" />
          ) : (
            <Icon name="lock" label={t("talent.forMe.courses.locked")} className="size-3.5" />
          )}
        </p>
      </div>
    </article>
  );
}

/** The horizontal row of course cards; scrolls sideways on a phone. */
export function CourseRow({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {children}
    </div>
  );
}

/** A row of a white list (Me positionner, prochaines actions, progression). */
export function ForMeRow({
  href,
  icon,
  tone,
  title,
  line,
}: {
  href: string;
  icon: IconName;
  tone: string;
  title: string;
  line?: string;
}) {
  return (
    <li className="border-b border-brume last:border-b-0">
      <Pressable href={href} className="rounded-none! bg-transparent! shadow-none!">
        <span
          aria-hidden
          className={cx("grid size-11 shrink-0 place-items-center rounded-[13px]", tone)}
        >
          <Icon name={icon} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14.5px] leading-snug font-semibold">{title}</span>
          {line && <span className="truncate text-[12.5px] text-ardoise">{line}</span>}
        </span>
      </Pressable>
    </li>
  );
}

export function RowList({ children }: { children: ReactNode }) {
  return (
    <ul className="flex flex-col overflow-hidden rounded-[22px] bg-blanc shadow-douce">
      {children}
    </ul>
  );
}
