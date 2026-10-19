import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AccessShowcase } from "@/components/access/showcase";
import { AppearanceRoot } from "@/components/talent/appearance";
import { pickMessages } from "@/i18n/client-messages";
import { appearanceScript } from "@/lib/appearance";

/**
 * Sign-in, sign-up and password screens (planche talent-4, refonte-web talent-4 § 1 et 2): on a
 * phone, the phone screen of the talent space without its bars; on a tablet, the same column
 * centred on the screen; from 1200 px, in two parts, the brand panel on the left and the form on
 * the right. Light or dark like the device.
 */
export default async function AccessLayout({ children }: LayoutProps<"/">) {
  const messages = await getMessages();
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
