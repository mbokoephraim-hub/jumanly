import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { cx } from "@/lib/cx";

/**
 * « Vos candidatures » as statistics (Admin v4, étape 7): a bar per step, from sent to offer,
 * sized against the applications sent, then a tile per step with its number in large and the
 * share that reached it. Nothing invented: every number comes from the talent's applications.
 * With no application yet, a short message and a link to the offers instead of four zeros.
 */
export async function ApplicationStats({
  headingId,
  counts,
  link,
}: {
  headingId: string;
  counts: { sent: number; viewed: number; interviews: number; offers: number };
  /** « Suivi » link next to the title (not on the follow-up page itself). */
  link?: boolean;
}) {
  const t = await getTranslations("talent.jobs.sidebar");
  const steps = [
    { key: "sent", value: counts.sent, bar: "bg-sapin/25", label: t("sent") },
    { key: "viewed", value: counts.viewed, bar: "bg-lime", label: t("viewed") },
    { key: "interviews", value: counts.interviews, bar: "bg-feuille", label: t("interviews") },
    { key: "offers", value: counts.offers, bar: "bg-sapin", label: t("offers") },
  ] as const;
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-[15px] font-semibold">
          {t("applications.text")}
        </h2>
        {link && (
          <Link
            href="/app/jobs/candidatures"
            className="text-xs font-semibold text-feuille-fonce hover:underline"
          >
            {t("applications.link")}
          </Link>
        )}
      </div>
      {counts.sent === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[18px] bg-creme p-4">
          <p className="text-[13px] leading-5 text-sapin">{t("empty")}</p>
          <Link href="/app/jobs" className={pillClass("dark", "sm")}>
            {t("emptyCta")}
            <Icon name="chev-r" className="size-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <figure className="flex flex-col gap-1.5">
            <figcaption className="sr-only">{t("chart")}</figcaption>
            {steps.map((step) => (
              <div key={step.key} aria-hidden className="h-2.5 rounded-pill bg-creme">
                <div
                  className={cx("h-full rounded-pill", step.bar)}
                  style={{
                    width: `${Math.max(step.value > 0 ? 4 : 0, (step.value / counts.sent) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </figure>
          <ul className="grid grid-cols-2 gap-2">
            {steps.map((step, index) => (
              <li key={step.key} className="flex flex-col gap-1 rounded-[16px] bg-creme p-3">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full", step.bar)} />
                  <span className="text-[26px] leading-none font-semibold">{step.value}</span>
                </span>
                <span className="text-xs leading-4 text-sapin">{step.label}</span>
                {index > 0 && (
                  <span className="text-[11px] leading-4 text-ardoise">
                    {t("rate", { value: step.value, total: counts.sent })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="flex items-center gap-2 border-t border-brume pt-3 text-xs text-ardoise">
        <Icon name="check" className="size-3.5 text-feuille" />
        {t("free")}
      </p>
    </section>
  );
}
