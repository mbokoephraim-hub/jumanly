import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentOrbi");
  return { title: t("metaTitle"), robots: { index: false } };
}

/** The four aids (planche Fondations § 11): each opens the existing feature. */
const aides: { key: "cv" | "interview" | "offer" | "path"; href: string; icon: TalentIconName }[] =
  [
    { key: "cv", href: "/app/career/cv", icon: "cv" },
    { key: "interview", href: "/app/career/entretiens", icon: "entretien" },
    { key: "offer", href: "/app/jobs", icon: "opportunites" },
    { key: "path", href: "/app/career/diagnostic", icon: "cap" },
  ];

/**
 * Orbi in full screen, the middle tab (docs/refonte-mobile, lot 1; planche Fondations § 9 and
 * § 11): the mark, the credits left this month, the four aids in colour. The conversation and its
 * history arrive in lot 7: until then the composer says so and the aids lead to the features.
 */
export default async function OrbiPage() {
  const user = await requireUser("/app/orbi");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  const t = await getTranslations("talentOrbi");
  const credits = await usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY);
  const left = credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <div className="t-or-tete t-tete">
        <OrbiMark size={48} />
        <div className="t-t">
          <b aria-hidden>{t("title")}</b>
          <span>{t("subtitle")}</span>
        </div>
        <span
          className="t-credits t-verre"
          aria-label={left === null ? t("creditsUnlimited") : t("creditsAria", { count: left })}
        >
          {left === null ? t("creditsUnlimited") : t("credits", { count: left })}
        </span>
      </div>

      <nav aria-label={t("aides.label")}>
        <ul className="t-aides">
          {aides.map((aide, index) => (
            <li key={aide.key} className="contents">
              <Link href={aide.href} className={`t-ai t-p${index + 1}`}>
                <span className="t-cases">
                  <TalentIcon name={aide.icon} size="s" />
                </span>
                <b>{t(`aides.${aide.key}`)}</b>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="t-bulle-o">
        <OrbiMark size={34} />
        <p className="t-corps t-verre">{t("intro")}</p>
      </div>

      <div className="t-orbi-bas">
        <div className="t-compo t-verre t-fort" aria-describedby="orbi-soon">
          <input
            type="text"
            disabled
            aria-label={t("composer.placeholder")}
            placeholder={t("composer.placeholder")}
          />
          <button type="button" className="t-bi" disabled aria-label={t("composer.dictate")}>
            <TalentIcon name="micro" size="s" />
          </button>
          <button type="button" className="t-bi t-env" disabled aria-label={t("composer.send")}>
            <TalentIcon name="envoyer" size="s" />
          </button>
        </div>
        <p id="orbi-soon" className="t-aide">
          {t("composer.soon")}
        </p>
      </div>
    </>
  );
}
