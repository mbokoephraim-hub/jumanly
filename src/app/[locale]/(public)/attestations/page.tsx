import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CertificateLookup } from "@/components/learn/certificate-lookup";
import { Eyebrow, HeroPanel, lead, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attestations">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("certificate.verify");
  return pageMetadata({
    path: "/attestations",
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

/** Verification form (layout of mockup 01-15): the number printed on an attestation leads to its page. */
export default async function CertificateLookupPage({
  params,
}: PageProps<"/[locale]/attestations">) {
  await applySiteLocale(params);
  const t = await getTranslations("certificate.verify");
  const learn = await getTranslations("trainings.hero");
  return (
    <>
      <MotionRoot />
      <HeroPanel className="pt-10 pb-14 lg:pt-20 lg:pb-28">
        <div
          className={cx(wrap, "relative flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16")}
        >
          <div className="flex flex-col gap-6 lg:w-[620px] lg:shrink-0">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow>{learn("eyebrow")}</Eyebrow>
            </div>
            <h1
              className="jm-word text-[40px] leading-[44px] font-semibold tracking-[-0.035em] lg:text-[64px] lg:leading-[66px]"
              style={stagger(1)}
            >
              {t("title")}
            </h1>
            <p className={cx(lead, "jm-rise text-sapin/85")} style={stagger(2)}>
              {t("intro")}
            </p>
            <div className="jm-rise" style={stagger(3)}>
              <CertificateLookup />
            </div>
          </div>
        </div>
      </HeroPanel>
    </>
  );
}
