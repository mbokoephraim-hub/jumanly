/* eslint-disable @next/next/no-img-element -- course covers come from S3 storage at a known size */
import { Icon } from "@/components/brand/icon";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "./badge";

/** Course card (§ 11.5). `plan` is the plan name read from the database, if the course is not free. */
export function CourseCard({
  title,
  href,
  level,
  lessons,
  duration,
  certificate = false,
  plan,
  image,
  status,
}: {
  title: string;
  href: string;
  level: string;
  lessons: number;
  duration: string;
  certificate?: boolean;
  plan?: string;
  image?: string;
  /** Extra line under the badges: progress, lock (signed-in catalog). */
  status?: ReactNode;
}) {
  const t = useTranslations("trainings.card");
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card bg-blanc">
      <div className="aspect-[16/9] bg-lime">
        {image && (
          <img src={image} alt={t("imageAlt", { title })} className="size-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone={plan ? "sapin" : "learn"}>
            {plan ? t("badge.plan", { plan }) : t("badge.free")}
          </Badge>
          {certificate && (
            <Badge tone="neutral" icon={<Icon name="certificat" className="size-4" />}>
              {t("certificate")}
            </Badge>
          )}
        </div>
        {status}
        <h3 className="text-lg leading-7 font-semibold">
          {/* The whole card is clickable; the link stays the only focusable element. */}
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-ardoise">
          <li>{t("level", { level })}</li>
          <li className="flex items-center gap-1">
            <Icon name="cours-video" className="size-4" />
            {t("lessons", { count: lessons })}
          </li>
          <li className="flex items-center gap-1">
            <Icon name="horloge" className="size-4" />
            {t("duration", { duration })}
          </li>
        </ul>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-card ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}
