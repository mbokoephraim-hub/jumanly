import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CtaBand, PageHero, Section } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("matchingPage.meta");
  return pageMetadata({
    path: "/comment-fonctionne-le-matching",
    title: t("title"),
    description: t("description"),
  });
}

const criteria = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const never = [1, 2, 3, 4, 5, 6, 7] as const;
const bands = ["veryHigh", "high", "partial", "low"] as const;
const faq = [1, 2, 3, 4] as const;

/** The matching explained to everyone (partie 08 § 8.6), linked from every « Pourquoi ? ». */
export default async function MatchingPage() {
  const t = await getTranslations("matchingPage");
  const block = (title: string, body: React.ReactNode) => (
    <article className="flex flex-col gap-3 rounded-card bg-blanc p-6">
      <h2 className="text-h2">{title}</h2>
      {body}
    </article>
  );
  return (
    <>
      <PageHero title={t("title")} text={t("lead")} />
      <Section tone="creme">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {block(t("s1.title"), <p>{t("s1.body")}</p>)}
          {block(
            t("s2.title"),
            <>
              <p>{t("s2.body")}</p>
              <ul className="list-disc pl-6">
                {criteria.map((n) => (
                  <li key={n}>{t(`s2.list.${n}`)}</li>
                ))}
              </ul>
            </>,
          )}
          {block(t("s3.title"), <p>{t("s3.body")}</p>)}
          {block(
            t("s4.title"),
            <>
              <ul className="list-disc pl-6">
                {bands.map((band) => (
                  <li key={band}>{t(`s4.${band}`)}</li>
                ))}
              </ul>
              <p className="font-medium">{t("s4.note")}</p>
            </>,
          )}
          {block(t("s5.title"), <p>{t("s5.body")}</p>)}
          {block(
            t("s6.title"),
            <>
              <p>{t("s6.body")}</p>
              <ul className="list-disc pl-6">
                {never.map((n) => (
                  <li key={n}>{t(`s6.list.${n}`)}</li>
                ))}
              </ul>
              <p>{t("s6.plan")}</p>
            </>,
          )}
          {block(t("s7.title"), <p>{t("s7.body")}</p>)}
          {block(t("s8.title"), <p>{t("s8.body")}</p>)}
          {block(t("s9.title"), <p>{t("s9.body")}</p>)}
        </div>
      </Section>
      <Section title={t("faq.title")} tone="blanc">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {faq.map((n) => (
            <details key={n} className="rounded-card bg-creme p-5">
              <summary className="cursor-pointer font-semibold">{t(`faq.q${n}`)}</summary>
              <p className="mt-2">{t(`faq.a${n}`)}</p>
            </details>
          ))}
          <p className="text-sm text-ardoise">{t("contact")}</p>
        </div>
      </Section>
      <CtaBand
        title={t("title")}
        actions={
          <ButtonLink href={signupHref({ profil: "talent" })} variant="inverse">
            {t("cta")}
          </ButtonLink>
        }
      />
    </>
  );
}
