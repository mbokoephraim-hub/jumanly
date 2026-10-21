import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { careerHome } from "@/server/services/career-phone";
import { careerView } from "./data";
import { PhoneCareer } from "./home";

/** The texts the screens of Carrière need in the browser. */
export async function CareerTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, ["phoneCareer", "phoneExplorer", "phoneFil", "phone"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * The Carrière tab, kept mounted under the pages (brief § 3): the person's profile, CVs,
 * achievements, progression and applications, all read at once while the logo shows.
 */
export async function CareerTab({ user }: { user: { id: string } }) {
  const now = new Date();
  const view = await careerView(await careerHome(db, user.id, now), now);
  return (
    <CareerTexts>
      <PhoneCareer view={view} />
    </CareerTexts>
  );
}
