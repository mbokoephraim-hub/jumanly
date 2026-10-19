import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvoiceRows } from "@/components/talent/billing/invoice-rows";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { interpolate, slot } from "@/lib/interpolate";
import { saveBillingDetailsAction } from "@/server/actions/billing";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("factures");
  return { title: t("seo"), robots: { index: false } };
}

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
const CONTACT_EMAIL = "assistant@jumanly.io";

/**
 * Factures (planche talent-4 § 7): every invoice of the person, newest first, with its PDF (the
 * existing route `/app/abonnement/factures/[id]/pdf`), and the details printed on the next ones.
 */
export default async function InvoicesPage({
  searchParams,
}: PageProps<"/app/abonnement/factures">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement/factures");
  if (await inOrganizationSpace(user.id)) redirect("/app/abonnement");
  const t = await getTranslations();
  const where = { subjectType: "user" as const, subjectId: user.id };
  const [invoices, details] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      include: { payment: { select: { method: true, operator: true } } },
    }),
    db.billingDetails.findUnique({
      where: { subjectType_subjectId: { subjectType: "user", subjectId: user.id } },
    }),
  ]);
  const saved = params.facturation === "1";
  const failed = params.facturation === "erreur";

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-h">
        <FlowHead
          back="/app/abonnement"
          backLabel={t("factures.back")}
          title={t("factures.title")}
        />
        <p className="t-w4-web t-w4-sub">
          {t("talentW4.invoices.subtitle", { count: invoices.length })}
        </p>
      </div>
      {saved && <Notice tone="ok">{t("factures.details.saved")}</Notice>}
      {failed && <Notice tone="err">{t("factures.details.error")}</Notice>}

      {invoices.length === 0 ? (
        <p className="t-gar">
          <TalentIcon name="document" size="s" />
          <span>{t("factures.empty")}</span>
        </p>
      ) : (
        <InvoiceRows invoices={invoices} table />
      )}

      <ul className="t-verre t-liste">
        <li>
          <SheetButton target="factures-infos" className="t-li t-press">
            <span className="t-cases" aria-hidden>
              <TalentIcon name="profil" size="s" />
            </span>
            <span className="t-t">
              <b>{t("factures.details.title")}</b>
              <span>{details?.name ?? t("factures.details.empty")}</span>
            </span>
            <TalentIcon name="suivant" />
          </SheetButton>
        </li>
      </ul>

      <p className="t-gar">
        <TalentIcon name="message" size="s" />
        <span>
          {interpolate(t("factures.contact", { email: slot("email") }), {
            email: (
              <a href={`mailto:${CONTACT_EMAIL}`} className="t-mail">
                {CONTACT_EMAIL}
              </a>
            ),
          })}
        </span>
      </p>

      <Sheet
        id="factures-infos"
        title={t("factures.details.title")}
        closeLabel={t("factures.close")}
        defaultOpen={failed}
      >
        <form action={saveBillingDetailsAction} className="t-flux">
          <input type="hidden" name="family" value="talent" />
          <input type="hidden" name="back" value="/app/abonnement/factures" />
          <p className="t-vide-t">{t("factures.details.text")}</p>
          <div className="t-champ">
            <label className="t-lab-c" htmlFor="factures-nom">
              {t("factures.details.name")}
            </label>
            <span className="t-verre t-saisie">
              <input
                id="factures-nom"
                name="name"
                required
                maxLength={160}
                autoComplete="name"
                defaultValue={details?.name ?? user.name}
              />
            </span>
          </div>
          <div className="t-champ">
            <label className="t-lab-c" htmlFor="factures-adresse">
              {t("factures.details.address")}
            </label>
            <span className="t-verre t-saisie">
              <input
                id="factures-adresse"
                name="address"
                maxLength={400}
                autoComplete="street-address"
                defaultValue={details?.address ?? ""}
              />
            </span>
          </div>
          <div className="t-champ">
            <label className="t-lab-c" htmlFor="factures-email">
              {t("factures.details.email")}
            </label>
            <span className="t-verre t-saisie">
              <input
                id="factures-email"
                name="email"
                type="email"
                maxLength={200}
                autoComplete="email"
                defaultValue={details?.email ?? ""}
              />
            </span>
          </div>
          <button type="submit" className="t-bt t-p t-pl t-press">
            {t("factures.details.save")}
          </button>
        </form>
      </Sheet>
    </div>
  );
}
