import { getTranslations } from "next-intl/server";
import {
  AuditNotice,
  ReasonField,
  SectionRule,
  SensitivePanel,
  adminCard,
  adminTitle,
} from "@/components/admin/kit";
import { courseFormId } from "@/components/admin/formations-fiche";
import { Icon } from "@/components/brand/icon";
import { Alert, Button, ButtonLink, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { revokeCertificateAction } from "@/server/actions/course-admin";
import type { AdminCourse } from "@/server/services/course-admin";

/**
 * « Attestation » step of the editor (Admin v3, étape 4; mockup 07-06): the switch, saved with
 * the course form of the step, the conditions, and a preview of the attestation the talent
 * receives (fictional name and number).
 */
export async function CourseAttestationCard({ course }: { course: AdminCourse }) {
  const t = await getTranslations("admin.courses");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section
        id="attestation-reglage"
        aria-labelledby="admin-course-attestation-title"
        className={cx(adminCard, "flex flex-col gap-3")}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="admin-course-attestation-title" className={cx(adminTitle, "lg:text-[22px]")}>
            {t("certificate.title")}
          </h2>
          <span className="relative inline-flex h-[26px] w-11 shrink-0">
            <input
              id="course-certificate"
              type="checkbox"
              role="switch"
              name="certificateEnabled"
              form={courseFormId}
              defaultChecked={course.certificateEnabled}
              aria-describedby="course-certificate-hint"
              className="peer absolute inset-0 cursor-pointer appearance-none rounded-pill bg-brume transition-colors checked:bg-sapin focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute top-[3px] left-[3px] size-5 rounded-full bg-blanc transition-transform peer-checked:translate-x-[18px] peer-checked:bg-lime motion-reduce:transition-none"
            />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <label htmlFor="course-certificate" className="text-[12.5px] text-ardoise">
            {t("certificate.enabled")}
          </label>
          <p id="course-certificate-hint" className="text-[11px] leading-[15px] text-ardoise">
            {t("v3.editor.attestation.saveHint")}
          </p>
        </div>
        <h3 className="text-[13px] font-semibold">{t("certificate.rule.text")}</h3>
        <ul className="flex flex-col gap-2.5 text-[13px]">
          {(["allLessons", "quizzes"] as const).map((rule) => (
            <li key={rule} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-sapin text-blanc"
              >
                <Icon name="check" className="size-3.5" />
              </span>
              {t(`certificate.rule.${rule}`)}
            </li>
          ))}
        </ul>
        <p className="mt-1 flex items-start gap-2.5 rounded-[12px] bg-creme px-3 py-2.5 text-[11.5px] leading-4">
          <Icon name="quiz" className="mt-px size-3.5 shrink-0" />
          {t("v3.editor.quiz.certificate")}
        </p>
        <Button type="submit" form={courseFormId} variant="secondary" className="self-start">
          {t("v3.editor.attestation.save")}
        </Button>
      </section>
      <CertificatePreview course={course} />
    </div>
  );
}

/** The attestation as the talent receives it, drawn with fictional details. */
async function CertificatePreview({ course }: { course: AdminCourse }) {
  const t = await getTranslations("admin.courses.v3.editor.attestation");
  return (
    <section
      aria-labelledby="certificate-preview-title"
      className={cx(adminCard, "flex flex-col gap-3")}
    >
      <h2 id="certificate-preview-title" className={adminTitle}>
        {t("preview")}
      </h2>
      {course.certificateEnabled ? (
        <figure className="relative overflow-hidden rounded-[18px] bg-creme p-1.5">
          <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-[14px] bg-blanc px-5 py-6 text-center ring-[1.5px] ring-sapin/15 ring-inset">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-2 bg-sapin bg-(image:--jm-degrade-rail-h)"
            />
            <span
              aria-hidden
              className="grid size-11 place-items-center rounded-full bg-sapin bg-(image:--jm-degrade-rail) text-lime"
            >
              <Icon name="check" className="size-5" />
            </span>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-ardoise uppercase">
              {t("heading")}
            </p>
            <p className="text-[12px] text-ardoise">{t("awarded")}</p>
            <p className="text-[19px] leading-6 font-semibold tracking-[-0.015em]">
              {t("learner")}
            </p>
            <p className="text-[12px] text-ardoise">{t("forCourse")}</p>
            <p className="max-w-[34ch] text-[15px] leading-5 font-semibold">{course.title}</p>
            {course.skills.length > 0 && (
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <p className="text-[10.5px] font-semibold tracking-[0.1em] text-ardoise uppercase">
                  {t("skills")}
                </p>
                <ul className="flex flex-wrap justify-center gap-1">
                  {course.skills.slice(0, 6).map((item) => (
                    <li
                      key={item.skillId}
                      className="rounded-pill bg-lime-clair px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {item.skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="pt-2 font-mono text-[10.5px] text-ardoise">{t("code")}</p>
          </div>
          <figcaption className="px-2 pt-2 pb-1 text-[11px] leading-[15px] text-ardoise">
            {t("note")}
          </figcaption>
        </figure>
      ) : (
        <p className="rounded-[14px] bg-creme px-4 py-5 text-center text-[12.5px] text-ardoise">
          {t("off")}
        </p>
      )}
    </section>
  );
}

/**
 * Revoking an attestation (sensitive action): a panel opened by `?action=revoquer`. First the
 * number of the attestation, then the confirmation with the required reason.
 */
export async function RevokeCertificateSection({
  course,
  query,
}: {
  course: AdminCourse;
  query: (key: string) => string;
}) {
  const t = await getTranslations("admin.courses");
  const common = await getTranslations("common");
  const sensitive = await getTranslations("admin.sensitive");
  const base = `/admin/formations/${course.id}`;
  const open = query("action") === "revoquer";
  const code = query("code").trim().toUpperCase().slice(0, 20);
  return (
    <section
      id="attestation"
      aria-label={t("certificate.revoke.text")}
      className="flex scroll-mt-6 flex-col gap-3"
    >
      <SectionRule>{sensitive("label")}</SectionRule>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          {query("attestation") === "revoquee" && (
            <Alert tone="success" title={t("certificate.revoke.done")} />
          )}
          {query("attestation") === "introuvable" && (
            <Alert tone="error" title={t("certificate.revoke.notFound")} />
          )}
          {!open ? (
            <ButtonLink
              href={`${base}?etape=attestation&action=revoquer#attestation`}
              scroll={false}
              variant="tertiary"
              icon={<Icon name="securite" />}
              className="self-start"
            >
              {t("certificate.revoke.text")}
            </ButtonLink>
          ) : (
            <SensitivePanel
              title={t("certificate.revoke.text")}
              text={code ? t("certificate.revoke.confirm", { code }) : t("certificate.revoke.ask")}
              closeHref={`${base}?etape=attestation#attestation`}
            >
              {code ? (
                <form action={revokeCertificateAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="course" value={course.id} />
                  <input type="hidden" name="code" value={code} />
                  <ReasonField id="course-revoke-reason" />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink
                      href={`${base}?etape=attestation#attestation`}
                      scroll={false}
                      variant="tertiary"
                    >
                      {common("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="danger">
                      {t("certificate.revoke.submit")}
                    </Button>
                  </div>
                </form>
              ) : (
                <form action={`${base}#attestation`} className="flex flex-col gap-3.5">
                  <input type="hidden" name="etape" value="attestation" />
                  <input type="hidden" name="action" value="revoquer" />
                  <TextField
                    id="certificate-revoke-code"
                    name="code"
                    label={t("certificate.revoke.code")}
                    required
                    maxLength={20}
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink
                      href={`${base}?etape=attestation#attestation`}
                      scroll={false}
                      variant="tertiary"
                    >
                      {common("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="secondary">
                      {t("certificate.revoke.next")}
                    </Button>
                  </div>
                </form>
              )}
            </SensitivePanel>
          )}
        </div>
        <AuditNotice />
      </div>
    </section>
  );
}
