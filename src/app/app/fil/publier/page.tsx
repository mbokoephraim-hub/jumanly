import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { PhoneCompose } from "@/components/phone/fil/compose";
import { feedWords, shortName } from "@/components/phone/fil/data";
import { FilTexts, meOf } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attachableItems, getPost, latestCertificate } from "@/server/services/feed";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneFil.publish");
  return { title: t("title"), robots: { index: false } };
}

/**
 * « Nouvelle publication » (Modèle B, lot B3). `?citer=<id>`: « Citer » a post;
 * `?brouillon=attestation`: Orbi's draft about the last attestation, ready to publish;
 * `?realisation=<id>`: « Partager dans le Fil » of a project of Carrière (lot B5);
 * `?attestation=<id>`: « Partager dans le Fil » of an attestation (lot B7), Orbi's draft about it.
 */
export default async function FilComposePage({ searchParams }: PageProps<"/app/fil/publier">) {
  const query = await searchParams;
  const user = await requireUser("/app/fil/publier");
  if (!(await isPhone())) redirect("/app");
  const t = await getTranslations("phoneFil.publish");
  const format = await getFormatter();
  const quotedId = typeof query.citer === "string" ? query.citer : null;
  const [items, certificate, quotedPost, words] = await Promise.all([
    attachableItems(db, user.id),
    latestCertificate(db, user.id),
    quotedId ? getPost(db, user.id, quotedId) : null,
    feedWords(user.id),
  ]);
  const day = (date: Date) =>
    t("certificateDetail", {
      date: format.dateTime(date, { day: "numeric", month: "short", year: "numeric" }),
    });
  const quoted = quotedPost ? words.post(quotedPost.post) : null;
  const askedId = typeof query.attestation === "string" ? query.attestation : null;
  const asked = askedId ? items.certificate.find((item) => item.id === askedId) : undefined;
  const shared = asked
    ? { id: asked.id, courseTitle: asked.title, issuedAt: asked.issuedAt }
    : certificate;
  return (
    <FilTexts>
      <PhoneCompose
        me={meOf({ name: user.name, image: user.image ?? null })}
        works={items.work.map((item) => ({ ...item, detail: t("workDetail") }))}
        certificates={items.certificate.map((item) => ({
          id: item.id,
          title: item.title,
          detail: day(item.issuedAt),
        }))}
        quoted={
          quoted ? { id: quoted.id, name: shortName(quoted.author.name), body: quoted.body } : null
        }
        draft={
          shared
            ? {
                text: t("draft", { course: shared.courseTitle }),
                course: shared.courseTitle,
                certificate: {
                  id: shared.id,
                  title: shared.courseTitle,
                  detail: day(shared.issuedAt),
                },
              }
            : null
        }
        back={asked ? `/app/learn/attestations/${asked.id}` : "/app"}
        startWithDraft={query.brouillon === "attestation" || Boolean(asked)}
        startWork={typeof query.realisation === "string" ? query.realisation : null}
      />
    </FilTexts>
  );
}
