import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { CopyLink } from "@/components/learn/copy-link";
import { Pattern } from "@/components/site/marketing";
import { ButtonLink, EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { myCertificates } from "@/server/services/learn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.certificates");
  return { title: t("seo"), robots: { index: false } };
}

/** An attestation delivered in the last 30 days is announced at the top of the page. */
const RECENT_DAYS = 30;
const isRecent = (date: Date) => Date.now() - date.getTime() < RECENT_DAYS * 24 * 60 * 60 * 1000;

const tiles: { icon: IconName; tone: string }[] = [
  { icon: "statistiques", tone: "bg-lime" },
  { icon: "objectif", tone: "bg-menthe-claire" },
  { icon: "certificat", tone: "bg-lime-clair" },
];

const pill =
  "inline-flex h-10 items-center justify-center gap-2 rounded-pill px-4 text-sm font-semibold";

/** « Mes attestations » (mockup 03-07): each one with its PDF and its public verification page. */
export default async function CertificatesPage() {
  const user = await requireUser("/app/learn/attestations");
  const t = await getTranslations("learn.certificates");
  const card = await getTranslations("learn.card");
  const certificates = await myCertificates(db, user.id);
  const valid = certificates.filter((certificate) => !certificate.revokedAt);
  const latest = valid[0];
  const fresh = latest && isRecent(latest.issuedAt) ? latest : undefined;
  const host = siteUrl().replace(/^https?:\/\//, "");
  const verifyPath = (code: string) => `/attestations/${code}`;
  const pdfHref = (id: string) => `/app/learn/attestations/${id}/pdf`;
  const latestUrl = latest ? `${host}${verifyPath(latest.code)}` : "";

  return (
    <>
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} />
      {fresh && (
        <section
          aria-labelledby="new-certificate"
          className="relative flex flex-col gap-3 overflow-hidden rounded-[28px] bg-lime p-6 lg:min-h-[184px] lg:px-[30px] lg:py-7 lg:pr-[160px]"
        >
          <Pattern name="motif-pastilles-clair" size={220} opacity={0.35} blend />
          <p className="relative text-[11px] font-semibold tracking-[0.14em] uppercase lg:text-xs">
            {t("congrats.eyebrow")}
          </p>
          <h2
            id="new-certificate"
            className="relative text-[24px] leading-tight font-bold tracking-tight lg:text-[28px]"
          >
            {t("congrats.title", { firstName: user.firstName ?? user.name })}
          </h2>
          <p className="relative max-w-[920px] text-[15px] leading-6">
            {t("congrats.body", { courseTitle: fresh.courseTitle })}
          </p>
          <div className="relative mt-1 flex flex-wrap gap-3">
            <a
              href={pdfHref(fresh.id)}
              className={cx(pill, "h-11 bg-sapin px-5 text-[15px] text-blanc")}
            >
              <Icon name="telecharger" className="size-4" />
              {t("download")}
            </a>
            <CopyLink
              path={verifyPath(fresh.code)}
              label={t("share")}
              copiedLabel={t("linkCopied")}
              className={cx(pill, "h-11 bg-blanc px-5 text-[15px]")}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG illustration */}
          <img
            src="/illustrations/jumanly-fatou-joie.svg"
            alt=""
            className="absolute right-8 bottom-0 h-[176px] w-auto max-lg:hidden"
          />
        </section>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold lg:text-[22px]">
          {t("count", { count: certificates.length })}
        </h2>
        <p className="text-[13px] leading-5 text-ardoise">{t("subtitle")}</p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          title={t("empty.text")}
          action={
            <ButtonLink href="/app/learn?liste=mes" variant="secondary">
              {t("empty.cta")}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate, index) => {
            const tile = tiles[index % tiles.length]!;
            return (
              <li
                key={certificate.id}
                className="flex min-w-0 flex-col gap-3 rounded-[24px] bg-blanc p-3 pb-5"
              >
                <div
                  aria-hidden
                  className="relative flex h-[150px] items-center justify-center overflow-hidden rounded-[18px] bg-sapin"
                >
                  <Pattern name="motif-orbites-sombre" size={150} opacity={0.4} />
                  <div className="relative flex h-[106px] w-[62%] flex-col items-center justify-center gap-2 rounded-xl bg-blanc">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static SVG symbol */}
                    <img src="/marque/jumanly-symbole-lime.svg" alt="" className="size-6" />
                    <span className="h-1 w-3/5 rounded-pill bg-sapin" />
                    <span className="h-0.5 w-4/5 rounded-pill bg-gris-clair" />
                    <span className="h-0.5 w-1/2 rounded-pill bg-gris-clair" />
                    <span
                      className={cx(
                        "mt-1 flex size-6 items-center justify-center rounded-full",
                        tile.tone,
                      )}
                    >
                      <Icon name={tile.icon} className="size-3.5" />
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 px-2">
                  <h3 className="text-base leading-snug font-semibold">
                    {certificate.courseTitle}
                  </h3>
                  <p className="mt-auto text-xs text-ardoise">
                    {[
                      certificate.revokedAt
                        ? t("revoked", { date: certificate.revokedAt })
                        : t("issued", { date: certificate.issuedAt }),
                      card("duration.text", { hours: certificate.hours }),
                    ].join(" · ")}
                  </p>
                  <p
                    className={cx(
                      "self-start rounded-pill px-2.5 py-1 font-mono text-[11px] font-semibold",
                      certificate.revokedAt
                        ? "bg-down-fond text-down-texte"
                        : "bg-gris-clair text-sapin",
                    )}
                  >
                    {t("number", { code: certificate.code })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!certificate.revokedAt && (
                      <a href={pdfHref(certificate.id)} className={cx(pill, "bg-sapin text-blanc")}>
                        <Icon name="telecharger" className="size-4" />
                        {t("download")}
                      </a>
                    )}
                    {!certificate.revokedAt && (
                      <CopyLink
                        path={verifyPath(certificate.code)}
                        label={t("copyLink")}
                        copiedLabel={t("linkCopied")}
                        className={cx(pill, "border border-brume hover:bg-creme")}
                      />
                    )}
                  </div>
                  <Link
                    href={verifyPath(certificate.code)}
                    className="flex items-center gap-1.5 border-t border-brume pt-3 text-sm font-semibold text-up-texte underline-offset-4 hover:underline"
                  >
                    <Icon name="securite" className="size-4" />
                    {t("verifyLink")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {latest && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section
            aria-labelledby="pdf-preview"
            className="flex min-w-0 flex-col gap-4 rounded-[24px] bg-blanc p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="pdf-preview" className="text-[20px] font-semibold lg:text-[22px]">
                {t("preview")}
              </h2>
              <span className="max-w-full truncate rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold">
                {latest.courseTitle}
              </span>
            </div>
            <div className="overflow-hidden rounded-[14px] bg-creme/60 shadow-[0_10px_30px_-12px_rgb(16_62_52/0.25)]">
              <div className="h-2.5 bg-gradient-to-r from-lime to-feuille" />
              <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
                <img src="/marque/jumanly-logo-principal.svg" alt="" className="h-9 w-auto" />
                <p className="text-[11px] font-semibold tracking-[0.14em] text-up-texte uppercase">
                  {t("pdf.title")}
                </p>
                <p className="max-w-[460px] text-sm leading-6">
                  {t("pdf.body", {
                    fullName: latest.holderName,
                    courseTitle: latest.courseTitle,
                    hours: latest.hours,
                  })}
                </p>
                <p className="text-xs text-ardoise">
                  {[
                    t("pdf.date", { date: latest.issuedAt }),
                    t("number", { code: latest.code }),
                  ].join(" · ")}
                </p>
                <p className="flex items-center gap-2 rounded-xl bg-blanc px-4 py-2.5 text-xs">
                  <Icon name="check" className="size-4 shrink-0 text-feuille" />
                  {t("pdf.verify", { verifyUrl: latestUrl })}
                </p>
                <p className="text-[11px] text-ardoise">{t("pdf.footer")}</p>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="public-link"
            className="relative flex flex-col gap-3 self-start overflow-hidden rounded-[24px] bg-sapin p-6 text-blanc"
          >
            <Pattern name="motif-points-sombre" size={110} opacity={0.5} />
            <span className="relative flex size-11 items-center justify-center rounded-xl bg-lime text-sapin">
              <Icon name="check" className="size-5" />
            </span>
            <h2 id="public-link" className="relative text-lg font-semibold">
              {t("publicLink.title")}
            </h2>
            <p className="relative text-[13px] leading-5 text-blanc/85">{t("publicLink.body")}</p>
            <p className="relative truncate rounded-xl bg-blanc/10 px-3 py-2.5 font-mono text-xs">
              {latestUrl}
            </p>
            <CopyLink
              path={verifyPath(latest.code)}
              label={t("copyLink")}
              copiedLabel={t("linkCopied")}
              className={cx(pill, "relative h-11 bg-lime text-sapin")}
            />
          </section>
        </div>
      )}
    </>
  );
}
