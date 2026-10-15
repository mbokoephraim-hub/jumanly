import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthAside } from "@/components/auth/auth-aside";
import { Logo } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import { Pattern } from "@/components/site/marketing";

/**
 * Steps of the sign-up, two-step sign-in, password reset and licence activation (mockups 02-02 to
 * 02-10): a Sapin panel with a character on the left, the form on Crème on the right.
 */
export default async function AuthStepsLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations();
  const texts = {
    eyebrow: t("auth.layout.eyebrow"),
    tagline: t("auth.layout.tagline"),
    intro: t("footer.tagline"),
    partnersTitle: t("talents.partners.title"),
    partnersText: t("talents.partners.text"),
    planText: {
      talent: t("signup.plan.freeReassurance.talent"),
      rh: t("signup.plan.freeReassurance.rh"),
      company: t("signup.plan.freeReassurance.company"),
    },
    checks: [t("home.hero.reassurance1"), t("home.hero.reassurance2"), t("home.hero.reassurance3")],
  };
  return (
    <div className="flex min-h-dvh bg-creme">
      <aside className="relative hidden w-[39%] max-w-[560px] shrink-0 overflow-hidden bg-sapin lg:block">
        <Pattern name="motif-trajectoires-sombre" size={420} opacity={0.9} />
        <div className="sticky top-0 h-dvh">
          <Link
            href="/"
            aria-label={t("auth.layout.backHome")}
            className="absolute top-11 left-[52px] z-10"
          >
            <Logo variant="negative" height={34} />
          </Link>
          <Suspense>
            <AuthAside texts={texts} />
          </Suspense>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 pt-4 lg:px-16 lg:pt-11">
          <Link href="/" className="lg:hidden" aria-label={t("auth.layout.backHome")}>
            <Logo height={30} />
          </Link>
          <Link
            href="/"
            className="hidden items-center gap-2 text-[13px] font-semibold text-sapin hover:underline lg:flex"
          >
            <Icon name="chev-l" className="size-4" />
            {t("auth.layout.backHome")}
          </Link>
          <p className="text-xs font-semibold text-ardoise lg:font-normal">
            <span className="lg:hidden" aria-label={t("auth.layout.languageLabel")}>
              {t("auth.layout.languageShort")}
            </span>
            <span className="max-lg:hidden">{t("footer.language")}</span>
          </p>
        </header>
        <main id="content" className="flex flex-1 justify-center px-4 pt-6 pb-10 lg:px-16 lg:pt-12">
          {children}
        </main>
        <footer className="px-4 pb-8 text-center text-xs text-ardoise lg:pb-12">
          {t("auth.layout.signature")}
          <span aria-hidden>{" · "}</span>
          {t("footer.col.contact.pro")}
        </footer>
      </div>
    </div>
  );
}
