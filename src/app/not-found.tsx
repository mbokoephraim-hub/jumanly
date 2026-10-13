import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ButtonLink } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("common.error.notFound");
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="content" className="flex flex-1 items-center bg-creme">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 page-x py-16 text-center">
          <Character name="kofi" pose="perplexe" height={200} />
          <h1 className="text-h1">{t("title")}</h1>
          <p className="text-lg text-ardoise">{t("text")}</p>
          <ButtonLink href="/">{t("cta")}</ButtonLink>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
