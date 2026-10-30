import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Eyebrow, Glow, heroTitle, lead, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { TestSurveyForm } from "@/components/site/test-survey-form";
import { Alert, Skeleton } from "@/components/ui";
import { pickMessages } from "@/i18n/client-messages";
import { applySiteLocale } from "@/i18n/site-locale";
import { cx } from "@/lib/cx";
import { keepTogether } from "@/lib/typography";
import { db } from "@/server/db";
import { surveyEntry } from "@/server/services/waitlist-test";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/questionnaire-test/[token]">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("testSurvey.seo");
  // A personal link: never indexed.
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * End-of-test questionnaire (30/10/2026): reached from the e-mail sent when a tester's period ends
 * (or earlier from the admin). The secret link stands for the person; one answer per link.
 */
export default async function TestSurveyPage({
  params,
}: PageProps<"/[locale]/questionnaire-test/[token]">) {
  await applySiteLocale(params);
  const t = await getTranslations("testSurvey");
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
        <div className={cx(wrap, "relative -mt-[96px] max-w-[860px] lg:-mt-[150px]")}>
          <div className="jm-rise" style={stagger(3)}>
            <Suspense
              fallback={<Skeleton className="h-[900px] rounded-[28px] lg:rounded-[32px]" />}
            >
              <Survey params={params} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}

async function Survey({
  params,
}: {
  params: PageProps<"/[locale]/questionnaire-test/[token]">["params"];
}) {
  await applySiteLocale(params);
  const { token } = await params;
  const [t, entry, messages] = await Promise.all([
    getTranslations("testSurvey"),
    surveyEntry(db, token),
    getMessages(),
  ]);
  if (!entry) {
    return (
      <Alert tone="error" title={t("unknown.title")}>
        {t("unknown.text")}
      </Alert>
    );
  }
  if (entry.feedback) {
    return (
      <Alert tone="success" title={t("done.alreadyTitle", { firstName: entry.firstName })}>
        {t("done.alreadyText")}
      </Alert>
    );
  }
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["testSurvey", "common"])}>
      <TestSurveyForm token={token} firstName={entry.firstName} />
    </NextIntlClientProvider>
  );
}
