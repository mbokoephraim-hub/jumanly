import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AccessShowcase } from "@/components/access/showcase";
import { AppearanceRoot } from "@/components/talent/appearance";
import { pickMessages } from "@/i18n/client-messages";
import { appearanceScript } from "@/lib/appearance";
import { phoneThemeScript } from "@/lib/phone-theme";
import { PhoneThemeColor } from "@/components/phone/theme-color";
import { isPhone } from "@/server/view";

/**
 * Sign-in, sign-up and password screens (planche talent-4, refonte-web talent-4 § 1 et 2): on a
 * tablet, the phone column centred on the screen; from 1200 px, in two parts, the brand panel on
 * the left and the form on the right. Light or dark like the device.
 *
 * On a phone, Modèle B (docs/modele-b, planche Accueil): dark only, the screen alone.
 */
export default function AccessLayout({ children }: LayoutProps<"/">) {
  // Phone or computer is read from the request: the frame streams like the pages inside it.
  return (
    <Suspense fallback={null}>
      <AccessFrame>{children}</AccessFrame>
    </Suspense>
  );
}

async function AccessFrame({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  if (await isPhone()) {
    return (
      <div className="nb-app nb-acces">
        <script dangerouslySetInnerHTML={{ __html: appearanceScript("dark") }} />
        <script dangerouslySetInnerHTML={{ __html: phoneThemeScript() }} />
        <PhoneThemeColor />
        <AppearanceRoot appearance="dark" />
        <NextIntlClientProvider
          messages={pickMessages(messages, ["access", "auth", "signup", "phoneAccueil", "phone"])}
        >
          <main id="content" className="nb-acces-page">
            {children}
          </main>
        </NextIntlClientProvider>
      </div>
    );
  }
  return (
    <div className="t-app t-acces">
      <script dangerouslySetInnerHTML={{ __html: appearanceScript("auto") }} />
      <AppearanceRoot appearance="auto" />
      <NextIntlClientProvider messages={pickMessages(messages, ["access", "auth", "signup"])}>
        <div className="t-split">
          <AccessShowcase />
          <main id="content" className="t-colonne t-contenu t-frm">
            {children}
          </main>
        </div>
      </NextIntlClientProvider>
    </div>
  );
}
