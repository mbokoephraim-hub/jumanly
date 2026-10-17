import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Opening, Splash } from "@/components/opening/opening";
import { getCurrentUser } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("opening");
  return { title: t("welcome.title"), robots: { index: false } };
}

async function Gate() {
  const user = await getCurrentUser();
  const t = await getTranslations("opening");
  return (
    <Opening
      signedIn={Boolean(user)}
      labels={{
        loading: t("loading"),
        title: t("welcome.title"),
        text: t("welcome.text"),
        start: t("welcome.start"),
        signIn: t("welcome.signIn"),
        chipJobs: t("welcome.chipJobs"),
        chipCertificate: t("welcome.chipCertificate"),
      }}
    />
  );
}

/**
 * Opening of the installed app (docs/ux-mobile-talent V6 § B8, screens 57 and 58): the address the
 * phone opens first (manifest start_url). The logo, then Pour moi when signed in, the sign-in page
 * when this phone already saw the welcome, the welcome otherwise.
 */
export default function OpeningPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Gate />
    </Suspense>
  );
}
