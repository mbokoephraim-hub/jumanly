import Link from "next/link";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Icon, Logo } from "@/components/brand";
import { footerNavigation, legalNavigation } from "@/config/navigation";
import { CookieSettingsButton } from "@/components/site/cookie-consent";
import { LanguageSwitch } from "./public-header";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getUTCFullYear();
}

/**
 * Public footer (identity of 28/10/2026): a Nuit panel with rounded corners, the brand block, three
 * columns, e-mail contacts (never a phone number), the language switch, legal links, the slogan
 * written very large and The Growth Lab signature.
 */
export async function PublicFooter() {
  const t = await getTranslations();
  const year = await currentYear();
  const contacts = [
    { label: t("footer.col.contact.proLabel"), email: t("footer.col.contact.pro") },
    { label: t("footer.col.contact.generalLabel"), email: t("footer.col.contact.general") },
  ];
  const link = "block text-[14px] leading-[32px] text-blanc/80 transition-colors hover:text-lime";
  const heading = "text-[13px] font-semibold text-neon";
  return (
    <footer className="border-t border-blanc/8 bg-nuit text-blanc">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden pt-12 pb-6 lg:pt-20 lg:pb-8">
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 xl:px-0">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="flex max-w-[360px] flex-col gap-5">
              <Logo variant="negative" height={34} />
              <p className="text-[15px] leading-6 text-blanc/70">{t("footer.tagline")}</p>
              <LanguageSwitch dark className="self-start" />
            </div>
            <div className="hidden flex-1 lg:block" />
            <div className="grid grid-cols-2 gap-8 lg:flex lg:gap-16">
              <nav aria-labelledby="footer-solutions" className="flex flex-col gap-2">
                <h2 id="footer-solutions" className={heading}>
                  {t("footer.col.solutions.text")}
                </h2>
                <ul>
                  {footerNavigation.solutions.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} className={link}>
                        {t(`footer.col.solutions.${item.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <nav aria-labelledby="footer-discover" className="flex flex-col gap-2">
                <h2 id="footer-discover" className={heading}>
                  {t("footer.col.discover.text")}
                </h2>
                <ul>
                  {footerNavigation.discover.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} className={link}>
                        {t(`footer.col.discover.${item.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="col-span-2 flex flex-col gap-3">
                <h2 className={heading}>{t("footer.col.contact.text")}</h2>
                {contacts.map(({ label, email }) => (
                  <div key={email} className="flex flex-col gap-1">
                    <span className="text-xs leading-4 text-blanc/65">{label}</span>
                    <a
                      href={`mailto:${email}`}
                      className="flex items-center gap-2 text-[14px] font-semibold hover:text-lime"
                    >
                      <span
                        aria-hidden
                        className="flex size-7 items-center justify-center rounded-full bg-lime text-sapin"
                      >
                        <Icon name="message" className="size-3.5" />
                      </span>
                      {email}
                    </a>
                  </div>
                ))}
                <Link
                  href="/contact"
                  className="mt-1 text-[14px] font-semibold text-lime underline-offset-4 hover:underline"
                >
                  {t("footer.col.contact.form")}
                </Link>
              </div>
            </div>
          </div>
          <p
            aria-hidden
            className="mt-14 bg-[linear-gradient(90deg,rgb(255_255_255/0.1),rgb(255_255_255/0.05))] bg-clip-text text-[15vw] leading-[0.9] font-semibold tracking-[-0.06em] text-transparent select-none lg:mt-20 lg:text-[150px]"
          >
            {t("footer.big")}
          </p>
          <div className="mt-8 mb-5 h-px bg-blanc/12" />
          <div className="flex flex-col gap-3 text-[12.5px] leading-5 text-blanc/70 lg:flex-row lg:justify-between">
            <ul className="flex flex-wrap gap-x-1.5 gap-y-1">
              {legalNavigation.map((item) => (
                <li key={item.key} className="after:ml-1.5 after:content-['·']">
                  <Link href={item.href} className="hover:text-lime">
                    {t(`footer.legal.${item.key}`)}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton label={t("footer.legal.cookieSettings")} />
              </li>
            </ul>
            <p>{t("footer.payments")}</p>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-[12.5px] leading-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-blanc/70">{t("footer.copyright", { year })}</p>
            <p className="flex items-center gap-2">
              <Logo variant="tile" height={22} />
              {t("footer.signature")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
