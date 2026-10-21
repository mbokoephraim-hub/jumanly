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
 * `?realisation=<id>`: « Partager dans le Fil » of a project of Carrière (lot B5).
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
          certificate
            ? {
                text: t("draft", { course: certificate.courseTitle }),
                course: certificate.courseTitle,
                certificate: {
                  id: certificate.id,
                  title: certificate.courseTitle,
                  detail: day(certificate.issuedAt),
                },
              }
            : null
        }
        back="/app"
        startWithDraft={query.brouillon === "attestation"}
        startWork={typeof query.realisation === "string" ? query.realisation : null}
      />
    </FilTexts>
  );
}
