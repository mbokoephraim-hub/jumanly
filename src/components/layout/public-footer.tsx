import Link from "next/link";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand";
import { footerNavigation, legalNavigation } from "@/config/navigation";
import { CookieSettingsButton } from "@/components/site/cookie-consent";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getUTCFullYear();
}

/** Public footer: links, e-mail contacts (never a phone number) and The Growth Lab signature. */
export async function PublicFooter() {
  const t = await getTranslations();
  const year = await currentYear();
  const contacts = [
    { label: t("footer.col.contact.proLabel"), email: t("footer.col.contact.pro") },
    { label: t("footer.col.contact.generalLabel"), email: t("footer.col.contact.general") },
  ];
  return (
    <footer className="bg-sapin text-blanc">
      <div className="mx-auto grid max-w-7xl gap-10 page-x py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo variant="negative" height={30} />
          <p className="text-lg font-medium text-lime">{t("footer.slogan")}</p>
          <p className="text-sm text-blanc/75">{t("footer.tagline")}</p>
          <p className="text-blanc/70 text-caption">{t("footer.signature")}</p>
        </div>
        <nav aria-labelledby="footer-solutions" className="flex flex-col gap-3 text-sm">
          <h2 id="footer-solutions" className="text-eyebrow text-neon">
            {t("footer.col.solutions.text")}
          </h2>
          <ul className="flex flex-col gap-2">
            {footerNavigation.solutions.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="hover:text-lime">
                  {t(`footer.col.solutions.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-discover" className="flex flex-col gap-3 text-sm">
          <h2 id="footer-discover" className="text-eyebrow text-neon">
            {t("footer.col.discover.text")}
          </h2>
          <ul className="flex flex-col gap-2">
            {footerNavigation.discover.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="hover:text-lime">
                  {t(`footer.col.discover.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 text-sm">
          <h2 className="text-eyebrow text-neon">{t("footer.col.contact.text")}</h2>
          {contacts.map(({ label, email }) => (
            <div key={email} className="flex flex-col">
              <span className="text-blanc/70 text-caption">{label}</span>
              <a href={`mailto:${email}`} className="hover:text-lime">
                {email}
              </a>
            </div>
          ))}
          <Link href="/contact" className="underline hover:text-lime">
            {t("footer.col.contact.form")}
          </Link>
        </div>
      </div>
      <div className="border-t border-blanc/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 page-x py-5 text-blanc/70 text-caption lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalNavigation.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="hover:text-lime">
                  {t(`footer.legal.${link.key}`)}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton label={t("footer.legal.cookieSettings")} />
            </li>
          </ul>
          <div className="flex flex-col gap-1 lg:items-end">
            <p>{t("footer.payments")}</p>
            <p>{t("footer.copyright", { year })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
