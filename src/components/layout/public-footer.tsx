import Link from "next/link";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Icon, Logo } from "@/components/brand";
import { footerNavigation, legalNavigation } from "@/config/navigation";
import { CookieSettingsButton } from "@/components/site/cookie-consent";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getUTCFullYear();
}

/**
 * Public footer (mockup 00-04): Sapin, brand block, three columns with Néon headings, e-mail
 * contacts (never a phone number), legal links and The Growth Lab signature.
 */
export async function PublicFooter() {
  const t = await getTranslations();
  const year = await currentYear();
  const contacts = [
    { label: t("footer.col.contact.proLabel"), email: t("footer.col.contact.pro") },
    { label: t("footer.col.contact.generalLabel"), email: t("footer.col.contact.general") },
  ];
  const link = "block text-sm leading-[30px] text-blanc/82 hover:text-lime";
  return (
    <footer className="bg-sapin pt-12 pb-7 text-blanc lg:pt-[72px] lg:pb-8">
      <div className="mx-auto max-w-[1200px] px-4 xl:px-0">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
          <div className="flex max-w-[340px] flex-col gap-4">
            <Logo variant="negative" height={36} />
            <p className="text-sm leading-[22px] text-blanc/66">{t("footer.tagline")}</p>
            <p className="text-lg font-semibold text-lime">{t("footer.slogan")}</p>
          </div>
          <div className="hidden flex-1 lg:block" />
          <div className="grid grid-cols-2 gap-7 lg:flex lg:gap-16">
            <nav aria-labelledby="footer-solutions" className="flex flex-col gap-2.5">
              <h2 id="footer-solutions" className="text-lab text-neon">
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
            <nav aria-labelledby="footer-discover" className="flex flex-col gap-2.5">
              <h2 id="footer-discover" className="text-lab text-neon">
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
            <div className="col-span-2 flex flex-col gap-2.5">
              <h2 className="text-lab text-neon">{t("footer.col.contact.text")}</h2>
              {contacts.map(({ label, email }) => (
                <div key={email} className="flex flex-col gap-1">
                  <span className="text-[11px] leading-[15px] text-blanc/66">{label}</span>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 text-sm font-semibold hover:text-lime"
                  >
                    <Icon name="message" className="size-4 text-lime" />
                    {email}
                  </a>
                </div>
              ))}
              <Link href="/contact" className="text-sm font-semibold text-lime hover:underline">
                {t("footer.col.contact.form")}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-11 mb-[22px] h-px bg-blanc/14" />
        <div className="flex flex-col gap-3 text-[12.5px] leading-5 text-blanc/66 lg:flex-row lg:justify-between">
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
          <p className="text-blanc/66">
            {t("footer.copyright", { year })}
            {" · "}
            {t("footer.language")}
          </p>
          <p className="flex items-center gap-2">
            <Logo variant="tile" height={22} />
            {t("footer.signature")}
          </p>
        </div>
      </div>
    </footer>
  );
}
