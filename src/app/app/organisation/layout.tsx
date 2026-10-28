import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { DesktopOnly } from "@/components/entreprise/desktop-only";
import { pickMessages } from "@/i18n/client-messages";
import { isPhone } from "@/server/view";

/**
 * The company's space is on a computer or a tablet only (étape 3, brief § 2): on a phone, or in a
 * window narrower than 768 px, « À ouvrir sur un ordinateur » takes the place of every page here.
 * Accepting an invitation (`/app/invitation`) and answering a join request (notifications) stay
 * open on a phone.
 */
export default async function OrganisationLayout({ children }: { children: ReactNode }) {
  if (!(await isPhone())) return children;
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["desktopOnly"])}>
      <DesktopOnly variant="app" />
    </NextIntlClientProvider>
  );
}
