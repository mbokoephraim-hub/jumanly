import { useTranslations } from "next-intl";
import { Badge, ButtonLink } from "@/components/ui";

/** Temporary home page (hero only): the full page comes with step E1. */
export default function HomePage() {
  const t = useTranslations();
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 page-x py-16 md:py-28">
      <Badge tone="lime">{t("home.hero.eyebrow")}</Badge>
      <h1 className="max-w-3xl text-display">{t("home.hero.title")}</h1>
      <p className="max-w-2xl text-lg leading-8 text-ardoise">{t("home.hero.subtitle")}</p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink href="/inscription" size="lg">
          {t("home.hero.ctaPrimary")}
        </ButtonLink>
        <ButtonLink href="/connexion" variant="tertiary" size="lg">
          {t("nav.login")}
        </ButtonLink>
      </div>
    </section>
  );
}
