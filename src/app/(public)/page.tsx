import { useTranslations } from "next-intl";
import { Badge, ButtonLink } from "@/components/ui";

/** Temporary home page: the real one comes with step E1. */
export default function HomePage() {
  const t = useTranslations("home");
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:py-28">
      <Badge tone="lime">{t("badge")}</Badge>
      <h1 className="max-w-3xl text-[40px] leading-[46px] font-semibold tracking-tight md:text-display">
        {t("title")}
      </h1>
      <p className="max-w-xl text-lg leading-8 text-ardoise">{t("subtitle")}</p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink href="/inscription" size="lg">
          {t("signUp")}
        </ButtonLink>
        <ButtonLink href="/connexion" variant="outline" size="lg">
          {t("signIn")}
        </ButtonLink>
      </div>
    </section>
  );
}
