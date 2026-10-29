import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CvStart } from "@/components/phone/cv/start";
import { CvTexts } from "@/components/phone/cv/texts";
import { CvFound } from "@/components/phone/cv/found";
import { CvImport } from "@/components/phone/cv/import";
import { CvOrbiPrepare } from "@/components/phone/cv/orbi";
import { CvTemplatePicker } from "@/components/phone/cv/templates";
import { stepsOf, templateChoices } from "@/components/phone/cv/data";
import { dynamic } from "@/i18n/dynamic";
import { startCvFromTemplateAction } from "@/server/actions/cv-flow";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { CV_FILE_MAX_BYTES } from "@/server/services/cv-file";
import { parseImport } from "@/server/services/cv-import";
import { getFullProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCv");
  return { title: t("seo"), robots: { index: false } };
}

const IMPORT_ERRORS = ["format", "size", "empty", "unreadable", "photo", "orbi"] as const;
const STEPS = ["depart", "modele", "orbi", "import", "trouve"] as const;

/**
 * Créer un CV on the phone (docs/carriere-v3, captures 06 to 15): the way in (`?etape=`
 * départ, modèle, orbi, import, trouvé); once the CV exists, its four steps live at
 * /app/career/cv/[id]?etape=. On a computer, « CV et documents » keeps its own window.
 */
export default async function NewCvPage({ searchParams }: PageProps<"/app/career/cv/nouveau">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/cv/nouveau");
  if (!(await isPhone())) redirect("/app/career/cv");
  const t = await getTranslations();
  const step = STEPS.find((key) => key === query.etape) ?? "depart";

  if (step === "modele") {
    const { choices, filters, sub } = await templateChoices(user.id);
    const asked = typeof query.modele === "string" ? query.modele : "";
    const initial =
      choices.find((choice) => choice.id === asked) ?? choices.find((c) => !c.lockedBy)!;
    return (
      <CvTexts>
        <FreshOnEachVisit>
          <CvTemplatePicker
            choices={choices}
            filters={filters}
            sub={sub}
            initial={initial.id}
            action={startCvFromTemplateAction}
            cvId={null}
            back="/app/career/cv/nouveau"
            steps={await stepsOf("modele", null)}
            error={query.erreur === "modele" ? t("phoneCv.template.lockedError") : null}
          />
        </FreshOnEachVisit>
      </CvTexts>
    );
  }

  if (step === "orbi") {
    const made = typeof query.cv === "string" ? query.cv.slice(0, 60) : null;
    const owned = made
      ? await db.document.findFirst({
          where: { id: made, kind: "cv", profile: { userId: user.id } },
          select: { id: true },
        })
      : null;
    const profile = await db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { targetJob: true },
    });
    const lines = [
      t("phoneCv.orbi.lineProfile"),
      t("phoneCv.orbi.lineExperiences"),
      profile?.targetJob
        ? t("phoneCv.orbi.lineSkillsFor", { job: profile.targetJob })
        : t("phoneCv.orbi.lineSkills"),
      t("phoneCv.orbi.lineLayout", { template: t("career.cv.template.name.moderne") }),
    ];
    return (
      <CvTexts>
        <FreshOnEachVisit>
          <CvOrbiPrepare key={owned?.id ?? "nouveau"} done={owned?.id ?? null} lines={lines} />
        </FreshOnEachVisit>
      </CvTexts>
    );
  }

  const pending = await db.aiSuggestion.findFirst({
    where: { userId: user.id, feature: "cv_parse", status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  const read = pending ? parseImport(pending.payload) : null;

  if (step === "trouve") {
    if (!pending || !read) redirect("/app/career/cv/nouveau?etape=import");
    return (
      <CvTexts>
        <FreshOnEachVisit>
          <CvFound importId={pending.id} read={read} profile={await getFullProfile(db, user.id)} />
        </FreshOnEachVisit>
      </CvTexts>
    );
  }

  if (step === "import") {
    const megabytes = Math.round(CV_FILE_MAX_BYTES / (1024 * 1024));
    const error = IMPORT_ERRORS.find((code) => code === query.erreur);
    const format = await getFormatter();
    return (
      <CvTexts>
        <FreshOnEachVisit>
          <CvImport
            key={error ?? "choisir"}
            max={megabytes}
            error={error ? dynamic(t)(`phoneCv.import.error.${error}`, { max: megabytes }) : null}
            last={
              pending && read
                ? {
                    name: read.file?.name ?? t("phoneCv.import.pasted"),
                    kind: read.file?.kind ?? null,
                    when: t("phoneCv.import.lastWhen", {
                      when: format.relativeTime(pending.createdAt),
                    }),
                  }
                : null
            }
          />
        </FreshOnEachVisit>
      </CvTexts>
    );
  }

  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { completeness: true },
  });
  return (
    <CvTexts>
      <FreshOnEachVisit>
        <CvStart
          percent={profile?.completeness ?? 0}
          error={query.erreur === "limite" ? t("phoneCv.start.limit") : null}
        />
      </FreshOnEachVisit>
    </CvTexts>
  );
}
