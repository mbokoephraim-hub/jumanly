import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";

/** The texts the screens of « Créer un CV » need in the browser. */
export async function CvTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneCv", "phoneCareer", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}
