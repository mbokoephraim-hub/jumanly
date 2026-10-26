import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { OFFER_TABS, RecruiterWebOffer, type OfferTab } from "@/components/recruiter/web-offer";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError, hirePermissions } from "@/server/services/hire";
import { isPhone } from "@/server/view";
import {
  RhOfferCandidates,
  RhOfferDetail,
  RhOfferPublished,
} from "@/components/phone/recruteur/offres";
import { listOffers } from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.detail");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * On a computer or a tablet, an offer of Modèle B (lot N2, captures 035 to 037): « Aperçu »,
 * « Annonce » and « Équipe et réglages » (`?onglet=`). Right after publication (`?publiee=`),
 * the same page with a toast that says whether the offer is live or under review.
 */
async function WebOffer({ params, searchParams }: PageProps<"/app/hire/offres/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}`);
  const t = await getTranslations("hireOffers");
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const tab: OfferTab = OFFER_TABS.find((key) => key === one(query.onglet)) ?? "apercu";
  const published = one(query.publiee);
  const ok = (["enregistree", "pause", "reprise"] as const).find(
    (value) => value === one(query.ok),
  );
  const review = published === "verification" || job.status === "pending_review";
  return (
    <>
      {(published === "1" || published === "verification") && (
        <ToastOnLoad
          message={review ? t("published.reviewTitle") : t("published.title")}
          tone="success"
        />
      )}
      {ok && <ToastOnLoad message={t(`detail.ok.${ok}`)} tone="success" />}
      {one(query.limite) && (
        <p className="rb-err rb-page-err" role="alert">
          {t("detail.limit")}
        </p>
      )}
      <RecruiterWebOffer
        ctx={ctx}
        jobId={job.id}
        tab={tab}
        ok={one(query.ok)}
        error={one(query.erreur)}
      />
    </>
  );
}

/**
 * On a phone (Modèle B recruteur, lot M4): the offer and its figures (planche
 * Recruteur-offre-detail), its candidates (`?vue=candidats`), or « Votre offre est en ligne »
 * right after publication (`?publiee=1`).
 */
async function PhoneOffer({ params, searchParams }: PageProps<"/app/hire/offres/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx, space } = await requireHire(`/app/hire/offres/${id}`);
  const now = new Date();
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const published = one(query.publiee);
  if (published === "1" || published === "verification")
    return (
      <RhOfferPublished
        job={job}
        review={published === "verification" || job.status === "pending_review"}
      />
    );
  const offers = await listOffers(db, ctx, now);
  const figures = offers.find((offer) => offer.id === job.id)?.figures ?? {
    applications: 0,
    unseen: 0,
    views: 0,
    interviews: 0,
  };
  if (one(query.vue) === "candidats" && permissions.readApplications)
    return <RhOfferCandidates ctx={ctx} jobId={job.id} unseen={figures.unseen} />;
  const ok = (["pause", "reprise"] as const).find((value) => value === one(query.ok));
  const tl = await getTranslations("hireOffers.list");
  return (
    <>
      {ok && <ToastOnLoad message={tl(`ok.${ok}`)} tone="success" />}
      <RhOfferDetail
        ctx={ctx}
        job={job}
        figures={figures}
        org={space.organization.name}
        manage={permissions.manage}
        period={one(query.jours) === "30" ? 30 : 7}
        openReport={one(query.rapport) === "1"}
        notice={one(query.limite) ? tl("limit") : undefined}
        now={now}
      />
    </>
  );
}

export default async function OfferPage(props: PageProps<"/app/hire/offres/[id]">) {
  if (await isPhone()) return <PhoneOffer {...props} />;
  return <WebOffer {...props} />;
}
