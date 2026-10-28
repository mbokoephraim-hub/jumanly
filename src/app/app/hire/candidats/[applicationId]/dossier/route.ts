import { NextResponse, type NextRequest } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { describeEvent } from "@/server/hire-history";
import { applicationMatches } from "@/server/matching/service";
import { pdfFileName, renderTextPdf } from "@/server/pdf/text-document";
import { sentAttachments } from "@/server/services/application-attachments";
import { visibleNotes } from "@/server/services/evaluation";
import { getOrgApplication, hirePermissions } from "@/server/services/hire";
import { screeningAnswersOf } from "@/server/services/screening";

export const maxDuration = 30;

const PARTS = ["fiche", "cv", "reponses", "notes", "historique"] as const;

/**
 * « Télécharger en PDF » of a candidate's file (Modèle B recruteur M5, planche
 * Recruteur-candidat-pdf): the parts chosen, for the recruiting team of the job's organization
 * only. Every download is written in the organization's journal (golden rule n° 5).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/hire/candidats/[applicationId]/dossier">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space || !hirePermissions(space.role).readApplications)
    return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  const { applicationId } = await params;
  const application = await getOrgApplication(db, ctx, applicationId).catch(() => null);
  if (!application) return new NextResponse(null, { status: 404 });
  const asked = request.nextUrl.searchParams.getAll("partie");
  const parts = PARTS.filter((part) => asked.includes(part));
  const chosen = parts.length ? parts : PARTS.filter((part) => part !== "historique");
  const t = await getTranslations("phoneRhCandidatures.pdf");
  const th = await getTranslations("hire");
  const format = await getFormatter();
  const { profile, job } = application;
  const person = profile.user;
  const blocks: string[] = [];

  if (chosen.includes("fiche")) {
    blocks.push(t("sections.fiche"));
    blocks.push(
      [person.name, profile.headline, person.city, t("job", { job: job.title })]
        .filter(Boolean)
        .join("\n"),
    );
    const matching = await level(
      db,
      { type: "organization", id: ctx.organizationId },
      "hire.matching.level",
    );
    if (matching !== "none") {
      const match = (await applicationMatches(db, [application])).get(application.id);
      if (match && match !== "disabled") {
        blocks.push(
          [
            t("score", { score: match.score }),
            ...match.criteria
              .filter((item) => item.status !== "not_applicable" && item.weight > 0)
              .map((item) =>
                t("criterion", {
                  name: t(`criteria.${item.key}`),
                  points: format.number(Math.round(item.value * item.weight * 10) / 10),
                  weight: item.weight,
                }),
              ),
            t("notUsed"),
          ].join("\n"),
        );
      }
    }
  }
  if (chosen.includes("cv")) {
    blocks.push(t("sections.cv"));
    blocks.push(
      [
        ...profile.experiences.map((item) =>
          t("experience", {
            title: item.title,
            company: item.company,
            from: String(item.startDate.getUTCFullYear()),
            to: item.endDate ? String(item.endDate.getUTCFullYear()) : t("now"),
          }),
        ),
        ...profile.educations.map((item) =>
          t("education", { degree: item.degree, school: item.school }),
        ),
        t("skills", {
          list: profile.skills
            .map((item) =>
              item.verified ? t("verified", { name: item.skill.name }) : item.skill.name,
            )
            .join(", "),
        }),
      ].join("\n") || t("empty"),
    );
  }
  if (chosen.includes("reponses")) {
    blocks.push(t("sections.reponses"));
    const answers = screeningAnswersOf(application.screeningAnswers).map(
      (item) => `${item.question}\n${item.answer}`,
    );
    const letter = application.coverLetter?.trim();
    const documents = sentAttachments(application.attachments).map((item) => item.title);
    blocks.push(
      [
        ...answers,
        letter ? `${t("letter")}\n${letter}` : null,
        documents.length ? t("documents", { list: documents.join(", ") }) : null,
      ]
        .filter(Boolean)
        .join("\n\n") || t("empty"),
    );
  }
  const actorIds = [
    ...new Set(
      application.events.map((event) => event.actorId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors = new Map(
    (
      await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    ).map((actor) => [actor.id, actor.name]),
  );
  if (chosen.includes("notes")) {
    blocks.push(t("sections.notes"));
    const notes = await visibleNotes(db, ctx, application.events);
    const scorecards = await db.scorecard.findMany({
      where: { applicationId: application.id },
      select: { reviewer: { select: { name: true } }, comment: true, ratings: true },
    });
    blocks.push(
      [
        ...notes.map((note) => {
          const body =
            note.payload && typeof note.payload === "object" && "body" in note.payload
              ? String((note.payload as { body: unknown }).body ?? "")
              : "";
          return `${actors.get(note.actorId ?? "") ?? ""} : ${body}`;
        }),
        ...scorecards.map((card) =>
          t("evaluation", { name: card.reviewer.name, comment: card.comment ?? "" }),
        ),
      ].join("\n\n") || t("empty"),
    );
  }
  if (chosen.includes("historique")) {
    blocks.push(t("sections.historique"));
    blocks.push(
      application.events
        .map((event) => {
          const line = describeEvent(th, actors.get(event.actorId ?? "") ?? "", event);
          return line
            ? `${format.dateTime(event.createdAt, { dateStyle: "short", timeStyle: "short" })} · ${line}`
            : null;
        })
        .filter(Boolean)
        .join("\n") || t("empty"),
    );
  }

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "candidate.pdf",
      targetType: "talentProfile",
      targetId: application.profileId,
      organizationId: ctx.organizationId,
      metadata: { applicationId: application.id, parts: chosen },
    },
  });
  const title = t("documentTitle", { name: person.name });
  const pdf = await renderTextPdf({
    title,
    text: blocks.join("\n\n"),
    footer: t("footer", { company: space.organization.name }),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(title, "dossier")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
