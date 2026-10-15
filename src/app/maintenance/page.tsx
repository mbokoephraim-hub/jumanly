import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character, Icon, Logo } from "@/components/brand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("system.maintenance");
  return { title: { absolute: t("meta.title") }, robots: { index: false } };
}

/**
 * Maintenance page (mockup 08-04): Profondeur background with the Orbites pattern, Neon badge.
 * With MAINTENANCE_MODE=1 at build time, every page is rewritten here (next.config.ts);
 * MAINTENANCE_UNTIL (« 14:00 ») and MAINTENANCE_CITY (« Kinshasa ») give the expected return.
 */
export default async function MaintenancePage() {
  const t = await getTranslations("system.maintenance");
  const until = process.env.MAINTENANCE_UNTIL?.trim();
  const city = process.env.MAINTENANCE_CITY?.trim() || "Kinshasa";
  return (
    <main
      id="content"
      className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-depth px-5 py-10 text-center text-blanc lg:p-[60px]"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url(/marque/motifs/motif-orbites-sombre.svg)] bg-[length:380px] opacity-55 lg:bg-[length:620px]"
      />
      <div className="flex max-w-[640px] flex-col items-center gap-5">
        <Logo variant="negative" height={34} />
        <div className="my-[18px] [&_img]:h-[220px]! lg:[&_img]:h-[300px]!">
          <Character name="nadia" pose="repos" height={300} />
        </div>
        <span className="inline-flex h-[30px] items-center gap-[5px] rounded-pill bg-neon px-3.5 text-[11px] font-semibold text-sapin">
          <Icon name="reglages" aria-hidden className="size-3.5" />
          {t("badge")}
        </span>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[48px] lg:leading-[54px]">
          {t("title")}
        </h1>
        <p className="text-base leading-7 text-blanc/78 lg:text-lg">
          {until
            ? t("body.text", { time: until, timezone: t("timezone", { city }) })
            : t("body.noTime")}
        </p>
        <ul className="flex flex-col gap-2.5 rounded-[20px] bg-blanc/7 px-5 py-4 text-left text-xs leading-[17px] ring-1 ring-blanc/14 ring-inset">
          <li className="flex items-center gap-2.5">
            <Icon name="securite" aria-hidden className="size-4 shrink-0 text-lime" />
            {t("data")}
          </li>
          <li className="flex items-center gap-2.5">
            <Icon name="message" aria-hidden className="size-4 shrink-0 text-lime" />
            {t("contact")}
          </li>
        </ul>
      </div>
    </main>
  );
}
