import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { pdfFileName, renderTextPdf } from "@/server/pdf/text-document";
import { hirePermissions } from "@/server/services/hire";
import { viewTalentProfile } from "@/server/services/talent-search";

export const maxDuration = 30;

/**
 * « Télécharger le profil en PDF » (Modèle B recruteur M6, planche 114): what the recruiter sees
 * of a talent's profile, as text, for the recruiting team only. The opening and the download are
 * both written in the organization's journal (golden rule 5).
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/app/hire/talents/[profileId]/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space || !hirePermissions(space.role).readApplications)
    return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  const { profileId } = await params;
  const view = await viewTalentProfile(db, ctx, profileId).catch(() => null);
  if (!view || view.status !== "ok") return new NextResponse(null, { status: 404 });
  const t = await getTranslations("phoneRhTalents");
  const { profile } = view;
  const name = view.anonymous ? t("card.anonymous") : profile.user.name;
  const blocks = [
    [name, profile.headline, profile.user.city].filter(Boolean).join("\n"),
    `${t("profile.skills")}\n${
      profile.skills
        .map(
          (item) =>
            `• ${item.skill.name} · ${item.verified ? t("profile.verified") : t("profile.declared")}`,
        )
        .join("\n") || t("profile.noSkills")
    }`,
    `${t("profile.experience")}\n${
      profile.experiences
        .map((item) => `• ${[item.title, item.company].filter(Boolean).join(" · ")}`)
        .join("\n") || t("profile.noExperience")
    }`,
    `${t("profile.education")}\n${
      profile.educations.map((item) => `• ${item.degree}, ${item.school}`).join("\n") ||
      t("profile.noEducation")
    }`,
    view.full ? "" : t("profile.summaryOnly"),
  ].filter(Boolean);
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "talent.pdf",
      targetType: "talentProfile",
      targetId: profile.id,
      organizationId: ctx.organizationId,
      metadata: { full: view.full },
    },
  });
  const title = `${t("pdf.title")} · ${name}`;
  const pdf = await renderTextPdf({
    title,
    text: blocks.join("\n\n"),
    footer: t("pdf.footer", { company: space.organization.name }),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(title, "profil")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
