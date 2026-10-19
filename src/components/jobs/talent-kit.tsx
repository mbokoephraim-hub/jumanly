import type { DynamicTranslator } from "@/i18n/dynamic";
import { formatUsd } from "@/lib/money";

/** Shared pieces of the signed-in pages not redrawn yet (Hire, Suivi, messages). */

export const tag =
  "inline-flex h-6 shrink-0 items-center gap-[5px] rounded-pill px-2.5 text-[11px] font-semibold whitespace-nowrap";
export const tagTone = {
  brume: "bg-brume text-sapin",
  neon: "bg-neon text-sapin",
  menthe: "bg-menthe-clair text-[#0B5E49]",
  sapin: "bg-sapin text-neon",
  ambre: "bg-[#FCEBC6] text-[#8A5A00]",
  lime: "bg-lime-clair text-sapin",
} as const;

/** Filter button of the filter row (38 px, visible ring and an arrow; Sapin when on). */
export const chip =
  "inline-flex h-[38px] shrink-0 cursor-pointer list-none items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap shadow-[0_1px_2px_rgb(11_26_31/0.05)] transition-colors [&::-webkit-details-marker]:hidden";
export const chipOff =
  "bg-blanc text-sapin ring-[1.5px] ring-sapin/20 ring-inset hover:bg-lime-clair hover:ring-sapin/45";
export const chipOn = "bg-sapin text-blanc";

export function salaryText(
  t: DynamicTranslator,
  job: { salaryMin: number | null; salaryMax: number | null },
) {
  if (job.salaryMin !== null && job.salaryMax !== null && job.salaryMax !== job.salaryMin) {
    return t("talent.jobs.card.salary.text", {
      min: formatUsd(job.salaryMin),
      max: formatUsd(job.salaryMax),
      currency: "USD",
    });
  }
  const single = job.salaryMin ?? job.salaryMax;
  return single !== null
    ? t("talent.jobs.card.salary.single", { amount: formatUsd(single), currency: "USD" })
    : t("talent.jobs.card.salary.undisclosed");
}
