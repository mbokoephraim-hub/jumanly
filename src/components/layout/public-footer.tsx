import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getUTCFullYear();
}

export async function PublicFooter() {
  const t = await getTranslations();
  const year = await currentYear();
  const contacts = [
    { label: t("footer.col.contact.proLabel"), email: t("footer.col.contact.pro") },
    { label: t("footer.col.contact.generalLabel"), email: t("footer.col.contact.general") },
  ];
  return (
    <footer className="bg-sapin text-blanc">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 page-x py-12 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo variant="negative" height={30} />
          <p className="text-lg font-medium text-lime">{t("common.slogan")}</p>
          <p className="text-sm text-blanc/75">{t("footer.tagline")}</p>
          <p className="text-blanc/70 text-caption">{t("common.signature")}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-eyebrow text-neon">{t("footer.col.contact.text")}</p>
          {contacts.map(({ label, email }) => (
            <div key={email} className="flex flex-col">
              <span className="text-blanc/70 text-caption">{label}</span>
              <a href={`mailto:${email}`} className="hover:text-lime">
                {email}
              </a>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-blanc/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 page-x py-5 text-blanc/70 text-caption sm:flex-row sm:justify-between">
          <p>{t("footer.copyright", { year })}</p>
          <p>{t("footer.payments")}</p>
        </div>
      </div>
    </footer>
  );
}
