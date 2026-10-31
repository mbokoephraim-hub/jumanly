import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";
import { PROFILE_PALETTE, type ProfileColor } from "@/lib/profile-colors";
import { db } from "@/server/db";
import { dynamic } from "@/i18n/dynamic";
import { listDocuments, parseDocument } from "@/server/services/career-documents";
import { careerHome } from "@/server/services/career-phone";
import { savedOffers } from "@/server/services/explore";
import { explorerWords } from "../explorer/data";
import { careerView } from "./data";
import { PhoneCareer, type LetterRow, type SavedOffer } from "./home";

/** The texts the screens of Carrière need in the browser. */
export async function CareerTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        "phoneCareer",
        "phoneProfile",
        "phoneCv",
        "phoneExplorer",
        "phoneFil",
        "phone",
      ])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * The Carrière tab, kept mounted under the pages (brief § 3): the person's progression, their
 * applications and saved offers, their CVs, portfolio and letters, all read at once while the logo
 * shows. Their profile itself is « Mon profil » (/app/profil).
 */
export async function CareerTab({ user }: { user: { id: string } }) {
  const now = new Date();
  const [home, documents, savedRows, words, t, format] = await Promise.all([
    careerHome(db, user.id, now),
    listDocuments(db, user.id),
    savedOffers(db, user.id, now),
    explorerWords(now),
    getTranslations(),
    getFormatter(),
  ]);
  const d = dynamic(t);
  const view = await careerView(home, now);
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });
  const hour = (date: Date) => format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
  const letters: LetterRow[] = documents.map((letter) => {
    const type = parseDocument(letter.content)?.type ?? "letter";
    // A letter Orbi wrote or one the person wrote and had read again.
    const isLetter = type === "letter" || type === "proofread";
    const tag =
      letter.colorTag && letter.colorTag in PROFILE_PALETTE
        ? {
            key: letter.colorTag as ProfileColor,
            hex: PROFILE_PALETTE[letter.colorTag as ProfileColor],
          }
        : null;
    return {
      id: letter.id,
      name: letter.title,
      tag,
      // « LT · Assistante en communication » (Ephraïm, 31/10/2026).
      title: isLetter ? t("phoneCareer.docs.letterTitle", { title: letter.title }) : letter.title,
      href: `/app/career/documents/${letter.id}`,
      line: isLetter
        ? t("phoneCareer.docs.letterMade", {
            date: day(letter.updatedAt),
            time: hour(letter.updatedAt),
          })
        : t("docs.letters.line", {
            type: d(`docs.letters.type.${type}`),
            date: day(letter.updatedAt),
          }),
    };
  });
  const saved: SavedOffer[] = savedRows.map((row) => {
    const offer = words.offer(row);
    return {
      id: offer.id,
      href: offer.href,
      title: offer.title,
      company: offer.company,
      city: offer.city,
      initials: offer.initials,
      tone: offer.tone,
      logo: offer.logo,
      score: offer.score,
      open: row.open,
    };
  });
  return (
    <CareerTexts>
      <PhoneCareer
        view={view}
        letters={letters}
        saved={saved}
        portfolio={home.portfolioSlug ? `/portfolio/${home.portfolioSlug}` : null}
      />
    </CareerTexts>
  );
}
