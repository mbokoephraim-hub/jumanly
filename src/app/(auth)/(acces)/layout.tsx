import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppearanceRoot } from "@/components/talent/appearance";
import { pickMessages } from "@/i18n/client-messages";
import { appearanceScript } from "@/lib/appearance";

/**
 * Sign-in, sign-up and password screens of the mobile redesign (planche talent-4): the phone screen
 * of the talent space, without its bars, in one centred column. Light or dark like the phone.
 */
export default async function AccessLayout({ children }: LayoutProps<"/">) {
  const messages = await getMessages();
  return (
    <div className="t-app t-acces">
      <script dangerouslySetInnerHTML={{ __html: appearanceScript("auto") }} />
      <AppearanceRoot appearance="auto" />
      <NextIntlClientProvider messages={pickMessages(messages, ["access", "auth", "signup"])}>
        <main id="content" className="t-colonne t-contenu">
          {children}
        </main>
      </NextIntlClientProvider>
    </div>
  );
}
