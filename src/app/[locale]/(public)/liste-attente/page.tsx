import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { IconName } from "@/components/brand/icon";
import {
  Eyebrow,
  Glow,
  IconTile,
  heroTitle,
  lead,
  stagger,
  wrap,
} from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { Skeleton } from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { pickMessages } from "@/i18n/client-messages";
import { applySiteLocale } from "@/i18n/site-locale";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { keepTogether } from "@/lib/typography";
import { profileFromQuery } from "@/server/services/waitlist";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/liste-attente">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("waitlist.seo");
  return pageMetadata({ path: "/liste-attente", title: t("title"), description: t("description") });
}

/**
 * Waitlist (29/10/2026): sign-up stays closed to the public; every « Créer un compte » of the site
 * leads here (`joinHref`). `?profil=recruteur` pre-selects the profile.
 */
export default async function WaitlistPage({
  params,
  searchParams,
}: PageProps<"/[locale]/liste-attente">) {
  await applySiteLocale(params);
  const t = await getTranslations("waitlist");
  return (
    <>
      <MotionRoot />
      <section data-scene className="relative overflow-hidden bg-papier">
        <Glow className="-top-40 -right-24 size-[460px] bg-feuille/20" />
        <Glow className="top-40 -left-48 size-[420px] bg-menthe/12" delay={-6} />
        <div className="relative mx-auto max-w-[1400px] px-1 pt-10 pb-[120px] lg:pt-20 lg:pb-[180px]">
          <div className={cx(wrap, "relative flex flex-col gap-5")}>
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
            </div>
            <h1 className={cx("jm-word max-w-[820px]", heroTitle)} style={stagger(1)}>
              {keepTogether(t("hero.title"))}
            </h1>
            <p className={cx(lead, "jm-rise max-w-[640px] text-ardoise")} style={stagger(2)}>
              {t("hero.text")}
            </p>
          </div>
        </div>
      </section>
      <section className="relative z-2 bg-papier pb-14 lg:pb-24">
        <div
          className={cx(
            wrap,
            "relative -mt-[96px] flex flex-col gap-5 lg:-mt-[150px] lg:flex-row lg:items-start lg:gap-7",
          )}
        >
          <div className="jm-rise min-w-0 lg:flex-1" style={stagger(3)}>
            <Suspense
              fallback={<Skeleton className="h-[720px] rounded-[28px] lg:rounded-[32px]" />}
            >
              <Form searchParams={searchParams} />
            </Suspense>
          </div>
          <aside className="flex flex-col gap-5 lg:w-[360px] lg:shrink-0">
            <Perks />
          </aside>
        </div>
      </section>
    </>
  );
}

async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/liste-attente">["searchParams"];
}) {
  const { profil } = await searchParams;
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["waitlist", "common"])}>
      <WaitlistForm initialProfile={profileFromQuery(profil)} countries={countryOptions()} />
    </NextIntlClientProvider>
  );
}

/** Why join now: early access, news only, applying stays free. */
async function Perks() {
  const t = await getTranslations("waitlist.perks");
  const items: { key: "early" | "news" | "free"; icon: IconName; tile: string }[] = [
    { key: "early", icon: "etoile", tile: "bg-lime text-sapin" },
    { key: "news", icon: "message", tile: "bg-neon text-sapin" },
    { key: "free", icon: "check", tile: "bg-menthe text-sapin" },
  ];
  return (
    <div
      className="jm-rise rounded-[28px] bg-blanc px-6 py-6 lg:px-[30px] lg:py-7"
      style={stagger(4)}
    >
      <h2 className="mb-2 text-xl leading-[26px] font-semibold tracking-[-0.015em]">
        {t("title")}
      </h2>
      <ul>
        {items.map((item, index) => (
          <li
            key={item.key}
            className={cx("flex items-start gap-3.5 py-4", index > 0 && "border-t border-brume")}
          >
            <IconTile icon={item.icon} size={44} className={item.tile} />
            <div className="flex flex-col gap-0.5">
              <p className="text-[15px] leading-[21px] font-semibold">{t(`${item.key}.title`)}</p>
              <p className="text-[13.5px] leading-5 text-ardoise">{t(`${item.key}.text`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
