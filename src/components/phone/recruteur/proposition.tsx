import "server-only";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { rhProposalAction } from "@/server/actions/phone-rh-candidatures";
import { PhoneIcon } from "../icon";
import { PhoneDateField } from "../calendar";

/**
 * « Proposition à … » (Modèle B recruteur M5, planche Recruteur-proposition): the monthly salary,
 * the start date and the message. It leaves in the conversation; the person accepts, refuses or
 * asks from Messages, and the member records the decision.
 */
export async function RhProposal({
  application,
  company,
  error,
}: {
  application: { id: string; firstName: string; job: string };
  company: string;
  error: boolean;
}) {
  const t = await getTranslations("phoneRhCandidatures.proposal");
  const back = `/app/hire/candidats/${application.id}`;
  return (
    <form action={rhProposalAction} className="nb-page nb-rh-detail nb-rh-prop">
      <header className="nb-rh-barre">
        <Link href={back} className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("back")}
        </Link>
      </header>
      <input type="hidden" name="application" value={application.id} />
      <section className="nb-rh-detail-h">
        <h1>{t("title", { name: application.firstName })}</h1>
        <p className="nb-meta">{application.job}</p>
      </section>
      <div className="nb-rh-eval-c">
        {error ? (
          <p className="nb-erreur" role="alert">
            {t("error")}
          </p>
        ) : null}
        <label className="nb-rh-plan-champ">
          <span className="nb-meta">{t("salary")}</span>
          <input name="salary" inputMode="numeric" pattern="[0-9]*" maxLength={7} />
        </label>
        <div className="nb-rh-plan-champ">
          <span className="nb-meta">{t("start")}</span>
          <NextIntlClientProvider messages={pickMessages(await getMessages(), ["phone"])}>
            <PhoneDateField name="start" label={t("start")} />
          </NextIntlClientProvider>
        </div>
        <label className="nb-rh-plan-champ">
          <span className="nb-meta">{t("message")}</span>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={6}
            className="nb-rh-zone"
            defaultValue={t("default", {
              name: application.firstName,
              job: application.job,
              company,
            })}
          />
        </label>
        <p className="nb-meta">{t("rule")}</p>
      </div>
      <div className="nb-bas">
        <button type="submit" className="nb-bp">
          {t("send")}
        </button>
      </div>
    </form>
  );
}
