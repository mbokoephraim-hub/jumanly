import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/talent/copy-button";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { attestationOnProfileAction } from "@/server/actions/learn";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { talentAttestation } from "@/server/services/attestations";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("attest.detail");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * An attestation (planche talent-3, « Détail d'une attestation » and « Partager »): the drawing,
 * its number and date « signée par Jumanly », « Visible sur mon profil », the PDF and the share
 * sheet (LinkedIn, WhatsApp, e-mail, image and the link to copy). The link shows only the name,
 * the course and the date.
 */
export default async function AttestationPage({
  params,
}: PageProps<"/app/learn/attestations/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/learn/attestations/${id}`);
  const certificate = await talentAttestation(db, user.id, id);
  if (!certificate) notFound();
  const t = await getTranslations();
  const format = await getFormatter();
  const verify = `${siteUrl()}/attestations/${certificate.code}`;
  const shown = verify.replace(/^https?:\/\//, "");
  const files = `/app/learn/attestations/${certificate.id}`;
  const issued = certificate.issuedAt;
  const message = t("attest.share.message", { course: certificate.courseTitle, url: verify });
  const linkedin = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: certificate.courseTitle,
    organizationName: "Jumanly",
    issueYear: String(issued.getUTCFullYear()),
    issueMonth: String(issued.getUTCMonth() + 1),
    certUrl: verify,
    certId: certificate.code,
  })}`;
  const shares = [
    { key: "linkedin", href: linkedin, icon: "connexion" as const, external: true },
    {
      key: "whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
      icon: "message" as const,
      external: true,
    },
    {
      key: "email",
      href: `mailto:?${new URLSearchParams({
        subject: t("attest.share.subject", { course: certificate.courseTitle }),
        body: message,
      })
        .toString()
        .replace(/\+/g, "%20")}`,
      icon: "message" as const,
      external: false,
    },
    { key: "image", href: `${files}/image`, icon: "telecharger" as const, external: false },
  ];

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/learn/mes-formations?vue=attestations"
        backLabel={t("attest.detail.back")}
        title={t("attest.detail.title")}
        end={
          <SheetButton target="at-options" className="t-bi t-press" label={t("attest.detail.more")}>
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        }
      />
      <div className="t-verre t-att-c">
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn on the server, per attestation */}
        <img
          src={`${files}/apercu`}
          alt={t("attest.detail.alt", {
            course: certificate.courseTitle,
            holder: certificate.holderName,
          })}
          width={1123}
          height={794}
          decoding="async"
        />
      </div>
      <div className="t-verre t-liste t-lignes">
        <div className="t-li">
          <span className="t-cases t-c2">
            <TalentIcon name="certificat" size="s" />
          </span>
          <span className="t-t">
            <b>{t("attest.detail.number", { code: certificate.code })}</b>
            <span>
              {t("attest.detail.issued", {
                date: format.dateTime(issued, { day: "numeric", month: "short", year: "numeric" }),
              })}
            </span>
          </span>
        </div>
        <form action={attestationOnProfileAction} className="t-li">
          <input type="hidden" name="id" value={certificate.id} />
          <input type="hidden" name="code" value={certificate.code} />
          <span className="t-cases t-c1">
            <TalentIcon name="profil" size="s" />
          </span>
          <span className="t-t" id="at-visible">
            <b>{t("attest.detail.visible")}</b>
            <span>
              {certificate.onProfile ? t("attest.detail.visibleOn") : t("attest.detail.visibleOff")}
            </span>
          </span>
          <button
            type="submit"
            name="visible"
            value={certificate.onProfile ? "0" : "1"}
            role="switch"
            aria-checked={certificate.onProfile}
            aria-labelledby="at-visible"
            className="t-press"
          >
            <span aria-hidden className={cx("t-sw", certificate.onProfile && "t-on")} />
          </button>
        </form>
      </div>
      <div className="t-bts">
        <a href={`${files}/pdf`} className="t-bt t-sec t-m t-pl t-press" download>
          <TalentIcon name="telecharger" size="s" />
          {t("attest.detail.pdf")}
        </a>
        <SheetButton target="at-partage" className="t-bt t-p t-m t-pl t-press">
          <TalentIcon name="partager" size="s" />
          {t("attest.detail.share")}
        </SheetButton>
      </div>
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        {t("attest.detail.check")}
      </p>

      <Sheet id="at-partage" title={t("attest.share.title")} closeLabel={t("offer.close")}>
        <ul className="t-partage">
          {shares.map((share) => (
            <li key={share.key}>
              <a
                href={share.href}
                className="t-press"
                {...(share.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...(share.key === "image"
                  ? { download: `attestation-${certificate.code}.png` }
                  : {})}
              >
                <span className="t-cases" aria-hidden>
                  <TalentIcon name={share.icon} size="s" />
                </span>
                {t(`attest.share.${share.key as "linkedin" | "whatsapp" | "email" | "image"}`)}
              </a>
            </li>
          ))}
        </ul>
        <div className="t-lien-p">
          <TalentIcon name="partager" size="s" />
          <span>{shown}</span>
          <CopyButton
            value={verify}
            label={t("attest.share.copy")}
            copied={t("attest.share.copied")}
            className="t-bt t-sec t-s t-press"
          />
        </div>
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          {t("attest.share.privacy")}
        </p>
      </Sheet>

      <Sheet id="at-options" title={t("attest.detail.more")} closeLabel={t("offer.close")}>
        <div className="t-verre t-liste t-lignes">
          <div className="t-li">
            <span className="t-cases t-c2">
              <TalentIcon name="confidentialite" size="s" />
            </span>
            <span className="t-t">
              <a href={verify} className="t-lien" target="_blank" rel="noopener noreferrer">
                <b>{t("attest.detail.openCheck")}</b>
              </a>
              <span>{shown}</span>
            </span>
            <TalentIcon name="suivant" />
          </div>
          <div className="t-li">
            <span className="t-cases t-c1">
              <TalentIcon name="lecon" size="s" />
            </span>
            <span className="t-t">
              <Link href={`/app/learn/${certificate.enrollment.course.slug}`} className="t-lien">
                <b>{t("attest.detail.course")}</b>
              </Link>
              <span>{certificate.courseTitle}</span>
            </span>
            <TalentIcon name="suivant" />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
