import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppearanceRoot } from "@/components/talent/appearance";
import { appearanceScript } from "@/lib/appearance";

/**
 * Public check of an attestation (planche web talent-3 § 8, `.site`): the page a recruiter opens
 * from the QR code or the link, in the style of the talent space, light or dark like the device.
 * The logo, « Vérifier une attestation », then one column of 760 px.
 */
export default async function VerificationLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("attest.web");
  return (
    <div className="t-app t-vpub">
      <script dangerouslySetInnerHTML={{ __html: appearanceScript("auto") }} />
      <Suspense fallback={null}>
        <AppearanceRoot appearance="auto" />
      </Suspense>
      <header className="t-vpub-h">
        <Link href="/" className="t-vpub-l" aria-label={t("home")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the brand tile, an SVG */}
          <img src="/marque/jumanly-symbole-lime.svg" alt="" width={34} height={34} />
          <span aria-hidden>{t("brand")}</span>
        </Link>
        <Link href="/attestations" className="t-code t-press">
          {t("check")}
        </Link>
      </header>
      <main id="content" className="t-vpub-c">
        {children}
      </main>
    </div>
  );
}
