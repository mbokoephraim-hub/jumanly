import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { PhoneIcon } from "@/components/phone/icon";
import { initialsOf } from "@/components/phone/recruteur/compte-initials";
import { RhFil } from "@/components/phone/recruteur/fil";
import { RecruiterAside } from "@/components/recruiter/web-aside";
import { ConnectButton, WebFilCompose } from "@/components/recruiter/web-fil-compose";
import { db } from "@/server/db";
import { publishingSpace, requireHire } from "@/server/hire-context";
import { hiringCompanies, peopleToKnow } from "@/server/services/explore";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhWeb.top.title");
  return { title: t("fil"), robots: { index: false } };
}

/**
 * The recruiter's Fil on a computer and a tablet (Modèle B, lot N2, capture 033): the composer
 * (220 characters, in one's own name or the company's), the Fil itself, and on the right Orbi,
 * « À connaître » and a company that recruits. The phone keeps its Fil tab (/app/hire).
 */
export default async function HireFilPage() {
  const { user, ctx } = await requireHire("/app/hire/fil");
  if (await isPhone()) redirect("/app/hire");
  const t = await getTranslations("rhWeb.fil");
  const now = new Date();
  const [space, people, companies, messages] = await Promise.all([
    publishingSpace(user.id),
    peopleToKnow(db, user.id, 3),
    hiringCompanies(db, now, 6),
    getMessages(),
  ]);
  const company = companies.find((item) => item.id !== ctx.organizationId) ?? null;
  const org = space?.canPublishAsOrg ? space.org.name.replace(/\s*\(.*\)$/, "") : null;
  return (
    <NextIntlClientProvider messages={{ rhWeb: { fil: messages.rhWeb.fil } }}>
      <div className="rb-cols">
        <div className="rb-col rb-fil">
          <RhFil
            user={{ id: user.id, name: user.name, image: user.image ?? null }}
            compose={
              // The Fil has its own texts: the composer gets its own provider.
              <NextIntlClientProvider messages={{ rhWeb: { fil: messages.rhWeb.fil } }}>
                <WebFilCompose org={org} />
              </NextIntlClientProvider>
            }
          />
        </div>
        <RecruiterAside question={t("orbi.question")} fact={t("orbi.fact")}>
          {people.length > 0 && (
            <section className="rb-aside-s" aria-labelledby="rb-fil-know">
              <h2 id="rb-fil-know">{t("know.title")}</h2>
              <ul className="rb-gens">
                {people.map((person) => (
                  <li key={person.id}>
                    <span aria-hidden className="rb-mini rb-rond">
                      {person.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a 40 px photo
                        <img src={person.image} alt="" />
                      ) : (
                        initialsOf(person.name)
                      )}
                    </span>
                    <span className="rb-gens-t">
                      <b>{person.name}</b>
                      <span className="rb-meta">
                        {[person.title, person.company ?? person.city]
                          .filter(Boolean)
                          .join(" · ") || t("know.talent")}
                      </span>
                    </span>
                    <ConnectButton personId={person.id} name={person.name} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {company && (
            <Link href={`/entreprises/${company.slug}`} className="rb-carte rb-ent-c t-press">
              <span aria-hidden className="rb-mini">
                {company.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a 40 px logo
                  <img src={company.logo} alt="" />
                ) : (
                  initialsOf(company.name)
                )}
              </span>
              <span className="rb-gens-t">
                <b>{company.name}</b>
                <span className="rb-meta">{t("company.offers", { count: company.offers })}</span>
              </span>
              <PhoneIcon name="chevron" size={18} stroke={2} />
            </Link>
          )}
        </RecruiterAside>
      </div>
    </NextIntlClientProvider>
  );
}
