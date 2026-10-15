import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { MotionRoot } from "@/components/site/motion";
import { pickMessages } from "@/i18n/client-messages";

/**
 * Sign-in and sign-up screens, without the site navigation. /connexion and /inscription draw their
 * own animated entry screen (docs/refonte-connexion); the other steps share the frame of
 * `(etapes)/layout.tsx` (mockups 02-02 to 02-10).
 */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const messages = await getMessages();
  return (
    <>
      <MotionRoot />
      <NextIntlClientProvider
        messages={pickMessages(messages, [
          "auth",
          "login",
          "signup",
          "forgot",
          "reset",
          "common",
          "checkout",
        ])}
      >
        {children}
      </NextIntlClientProvider>
    </>
  );
}
