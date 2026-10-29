import { Suspense } from "react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { db } from "@/server/db";
import { answerReferenceAction } from "@/server/actions/reference-check";
import { findReferenceCheck } from "@/server/services/reference-check";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reference.page");
  // A person's name and career are shown: the page is reached by its link only, never indexed.
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The referent's page (« Faire vérifier », demande d'Ephraïm du 29/10/2026), opened from the
 * e-mail: who asks, what to confirm, then « Je confirme » or « Je ne peux pas confirmer ». No
 * account is needed; the link works once and for 30 days.
 */
export default function ReferencePage({ params }: PageProps<"/confirmer-reference/[token]">) {
  return (
    <Suspense fallback={<div className="t-verre t-v-ok t-vpub-attente" aria-busy="true" />}>
      <Reference params={params} />
    </Suspense>
  );
}

async function Reference({
  params,
}: {
  params: PageProps<"/confirmer-reference/[token]">["params"];
}) {
  const { token } = await params;
  const t = await getTranslations("reference.page");
  const format = await getFormatter();
  const check = await findReferenceCheck(db, token);
  if (!check || check.expired)
    return (
      <div className="t-flux" role="status">
        <h1 className="sr-only">{t("title")}</h1>
        <div className="t-verre t-v-ko t-v-inconnue">
          <TalentIcon name="recherche" size="s" />
          <span>
            <b>{t("invalid.title")}</b> {t("invalid.text")}
          </span>
        </div>
      </div>
    );
  const user = check.profile.user;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name;
  const month = (date: Date) =>
    format.dateTime(date, { month: "long", year: "numeric", timeZone: "UTC" });
  const rows = check.experience
    ? [
        { label: t("job"), value: check.experience.title },
        { label: t("company"), value: check.experience.company },
        {
          label: t("period"),
          value: check.experience.endDate
            ? t("range", {
                start: month(check.experience.startDate),
                end: month(check.experience.endDate),
              })
            : t("since", { start: month(check.experience.startDate) }),
        },
      ]
    : check.education
      ? [
          { label: t("training"), value: check.education.degree },
          { label: t("organization"), value: check.education.school },
          ...(check.education.endYear
            ? [{ label: t("year"), value: String(check.education.endYear) }]
            : []),
        ]
      : [];
  const answered = check.status === "confirmed" || check.status === "declined";
  return (
    <div className="t-flux">
      <h1 className="sr-only">{t("title")}</h1>
      {answered ? (
        <div className="t-verre t-v-ok" role="status">
          <span className="t-rond-ok" aria-hidden>
            <TalentIcon name="valider" />
          </span>
          <h2>{t("thanks")}</h2>
          <p>{check.status === "confirmed" ? t("confirmed", { name }) : t("declined", { name })}</p>
        </div>
      ) : (
        <div className="t-verre t-v-ok">
          <h2>{t("question", { name })}</h2>
          <p>{check.experience ? t("textExperience", { name }) : t("textCertificate", { name })}</p>
        </div>
      )}
      <dl className="t-verre t-liste t-lignes">
        {rows.map((row) => (
          <div key={row.label} className="t-li">
            <div className="t-t">
              <dt>
                <span>{row.label}</span>
              </dt>
              <dd>
                <b>{row.value}</b>
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {answered ? null : (
        <form action={answerReferenceAction} className="t-bts">
          <input type="hidden" name="token" value={token} />
          <button type="submit" name="answer" value="confirm" className="t-bt t-a t-press">
            {t("confirm")}
          </button>
          <button type="submit" name="answer" value="decline" className="t-bt t-sec t-press">
            {t("decline")}
          </button>
        </form>
      )}
      <p className="t-v-ko">
        <TalentIcon name="aide" size="s" />
        <span>{t("warning")}</span>
      </p>
    </div>
  );
}
