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
import { Alert, Button, ButtonLink, Select, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { revokeCertificateAction, setCourseStatusAction } from "@/server/actions/course-admin";
import { courseStatuses, type AdminCourse } from "@/server/services/course-admin";

/**
 * « Attestation » card of mockup 07-06: the switch (saved with the course form), the conditions,
 * the publication check and the status of the course.
 */
export async function CourseAttestationCard({ course }: { course: AdminCourse }) {
  const t = await getTranslations("admin.courses");
  return (
    <section
      id="publication"
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
          {t("certificate.withFiche")}
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

      <p className="mt-1 flex items-start gap-2.5 rounded-[12px] bg-creme px-3 py-2.5 text-[11px] leading-4">
        <Icon name="check" className="mt-px size-3.5 shrink-0" />
        {t("publish.check")}
      </p>
      {course.status !== "published" && (
        <form action={setCourseStatusAction}>
          <input type="hidden" name="course" value={course.id} />
          <input type="hidden" name="status" value="published" />
          <Button type="submit" fullWidth>
            {t("publish.text")}
          </Button>
        </form>
      )}
      <form action={setCourseStatusAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="course" value={course.id} />
        <Select
          id="course-status"
          name="status"
          label={t("status.text")}
          defaultValue={course.status}
          options={courseStatuses.map((status) => ({
            value: status,
            label: t(`status.${status}`),
          }))}
        />
        <Button type="submit" variant="tertiary" size="sm" className="self-start">
          {t("status.change")}
        </Button>
      </form>
      <p className="text-[11px] leading-[15px] text-ardoise">{t("editorOnly")}</p>
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
              href={`${base}?action=revoquer#attestation`}
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
              closeHref={`${base}#attestation`}
            >
              {code ? (
                <form action={revokeCertificateAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="course" value={course.id} />
                  <input type="hidden" name="code" value={code} />
                  <ReasonField id="course-revoke-reason" />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={`${base}#attestation`} scroll={false} variant="tertiary">
                      {common("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="danger">
                      {t("certificate.revoke.submit")}
                    </Button>
                  </div>
                </form>
              ) : (
                <form action={`${base}#attestation`} className="flex flex-col gap-3.5">
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
                    <ButtonLink href={`${base}#attestation`} scroll={false} variant="tertiary">
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
