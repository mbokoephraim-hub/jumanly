import "server-only";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { templateKey } from "@/features/cv/examples";
import { templateImage } from "@/features/cv/templates/images";
import {
  cvTemplateRegistry,
  includesAccess,
  templateOf,
  type CvTemplate,
} from "@/features/cv/templates/registry";
import { dynamic } from "@/i18n/dynamic";
import { newCareerCvAction } from "@/server/actions/career-phone";
import { setCvTemplate } from "@/server/actions/cv";
import { db } from "@/server/db";
import { templatesAccess, TEMPLATES_ACCESS_KEY } from "@/server/services/cv";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { CareerTexts } from "./server";
import { SettingsFrame } from "./settings";

/**
 * « Choisir un modèle » on the phone (planche Carrière-cv-modele): every template, the ones the
 * person's plan includes first. A new CV starts in it (`cv` absent), or an existing CV takes it.
 * A template of another plan says which one and opens « Ma formule ».
 */
export async function PhoneTemplates({
  userId,
  cv,
}: {
  userId: string;
  cv: { id: string; templateId: string } | null;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const [granted, plans] = await Promise.all([
    templatesAccess(db, { type: "user", id: userId }),
    listPublicPlans(db),
  ]);
  const included = (template: CvTemplate) => includesAccess(granted, template.access);
  const lockPlan = (template: CvTemplate) =>
    talentPlanFor(
      plans,
      TEMPLATES_ACCESS_KEY,
      template.access === "pro" ? ["pro"] : ["starter", "pro"],
    );
  const current = cv ? templateOf(cv.templateId).id : null;
  const list = [...cvTemplateRegistry].sort((a, b) => Number(included(b)) - Number(included(a)));
  return (
    <CareerTexts>
      <SettingsFrame
        title={t("phoneCareer.cvEdit.templatesTitle")}
        back={cv ? `/app/career/cv/${cv.id}` : "/app/career/cv"}
      >
        <p className="nb-meta nb-ca-intro">
          {cv ? t("phoneCareer.cvEdit.templatesChange") : t("phoneCareer.cvEdit.templatesStep")}
        </p>
        <ul className="nb-ca-modeles">
          {list.map((template) => {
            const name = d(`career.cv.template.name.${templateKey(template.id)}`);
            const open = included(template);
            const plan = open ? null : lockPlan(template);
            const picture = (
              <span
                className="nb-ca-modele-img"
                data-actuel={template.id === current ? "" : undefined}
              >
                <Image src={templateImage(template)} alt="" width={300} height={424} sizes="45vw" />
                {plan ? <em>{plan}</em> : null}
              </span>
            );
            return (
              <li key={template.id}>
                {!open ? (
                  <Link
                    href="/app/abonnement"
                    aria-label={t("phoneCareer.cvEdit.templateLocked", { name, plan: plan ?? "" })}
                  >
                    {picture}
                    <span>{name}</span>
                  </Link>
                ) : cv ? (
                  <form action={setCvTemplate}>
                    <input type="hidden" name="id" value={cv.id} />
                    <input type="hidden" name="template" value={template.id} />
                    <button type="submit" aria-pressed={template.id === current}>
                      {picture}
                      <span>{name}</span>
                    </button>
                  </form>
                ) : (
                  <form action={newCareerCvAction}>
                    <input type="hidden" name="template" value={template.id} />
                    <button type="submit">
                      {picture}
                      <span>{name}</span>
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </SettingsFrame>
    </CareerTexts>
  );
}
