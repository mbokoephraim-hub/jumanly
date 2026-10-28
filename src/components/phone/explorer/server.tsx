import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { explorerHome } from "@/server/services/explore";
import { initialsOf } from "../fil/data";
import { explorerWords, homeView } from "./data";
import { PhoneExplorer } from "./home";

/** The texts the screens of Explorer need in the browser. */
export async function ExplorerTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, ["phoneExplorer", "phoneFil", "phone"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/** The most frequent values of a list, most frequent first. */
function top(values: string[], take: number) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([value]) => value);
}

/**
 * The Explorer tab, kept mounted under the pages (brief § 3): the offers ranked for the person,
 * the companies, the new offers and the people to know are all read at once, while the logo shows.
 */
export async function ExplorerTab({
  user,
}: {
  user: { id: string; name: string; image: string | null };
}) {
  const now = new Date();
  const [home, words, profile] = await Promise.all([
    explorerHome(db, user.id, now),
    explorerWords(now),
    db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { desiredLocations: true },
    }),
  ]);
  const city = profile?.desiredLocations[0] ?? null;
  // « Populaires à Kinshasa »: the fields and contracts the most offered there (or everywhere).
  const near = home.offers.filter(
    (offer) => !city || offer.city.toLowerCase() === city.toLowerCase(),
  );
  const pool = near.length > 0 ? near : home.offers;
  const popular = [
    ...top(
      pool.flatMap((offer) => (offer.domain ? [words.domain(offer.domain)] : [])),
      3,
    ),
    ...top(
      pool.map((offer) => words.contract(offer.contractType)),
      2,
    ),
  ];
  const cities = top(
    home.offers.map((offer) => offer.city),
    6,
  ).map((name) => ({
    city: name,
    offers: home.offers.filter((offer) => offer.city === name).length,
  }));
  return (
    <ExplorerTexts>
      <PhoneExplorer
        me={{ name: user.name, initials: initialsOf(user.name), image: user.image, city }}
        saved={home.saved}
        lists={homeView(home, words)}
        cities={cities}
        popular={[...new Set(popular)]}
      />
    </ExplorerTexts>
  );
}
