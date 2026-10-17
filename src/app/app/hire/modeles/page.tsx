import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Alert, Button, Select, TextField } from "@/components/ui";
import { deleteTemplateAction, saveTemplateAction } from "@/server/actions/hire-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import {
  listTemplates,
  TEMPLATE_BODY_MAX,
  templateKinds,
} from "@/server/services/message-templates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.templates");
  return { title: t("page.title"), robots: { index: false } };
}

const field =
  "w-full rounded-[18px] bg-blanc px-4 py-3.5 text-[15px] leading-relaxed ring-[1.5px] ring-brume ring-inset focus-visible:outline-2 focus-visible:outline-sapin";

/**
 * The organization's message templates (prompt 5): convocation, document request, follow-up,
 * acceptance, refusal. Only this organization's templates are listed and edited; without one,
 * Jumanly's default text is used.
 */
export default async function TemplatesPage({ searchParams }: PageProps<"/app/hire/modeles">) {
  const query = await searchParams;
  const { ctx } = await requireHire("/app/hire/modeles", "readApplications");
  const t = await getTranslations("hire.templates");
  const templates = await listTemplates(db, ctx);
  const manage = hirePermissions(ctx.role).manage;
  const kindOptions = templateKinds.map((kind) => ({ value: kind, label: t(`kind.${kind}`) }));

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 pb-6">
      <AppPageHeader title={t("page.title")} subtitle={t("page.subtitle")} />
      {query.ok === "enregistre" && <Alert tone="success" title={t("page.saved")} />}
      {query.ok === "supprime" && <Alert tone="success" title={t("page.deleted")} />}
      {query.erreur === "1" && <Alert tone="error" title={t("page.error")} />}
      <p className="rounded-[18px] bg-creme px-4 py-3 text-[13.5px]">{t("page.placeholders")}</p>

      {templates.length === 0 ? (
        <p className="rounded-[20px] bg-blanc p-4 text-[14px] text-ardoise">{t("page.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((template) => (
            <li key={template.id} className="rounded-[22px] bg-blanc p-4">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15.5px] font-semibold">{template.title}</span>
                    <span className="text-[13px] text-ardoise">{t(`kind.${template.kind}`)}</span>
                  </span>
                  <span className="text-[13px] font-semibold text-feuille-fonce">
                    {manage ? t("page.edit") : t("page.view")}
                  </span>
                </summary>
                {manage ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <form action={saveTemplateAction} className="flex flex-col gap-3">
                      <input type="hidden" name="template" value={template.id} />
                      <Select
                        id={`template-kind-${template.id}`}
                        name="kind"
                        label={t("page.kind")}
                        defaultValue={template.kind}
                        options={kindOptions}
                      />
                      <TextField
                        id={`template-title-${template.id}`}
                        name="title"
                        required
                        minLength={2}
                        maxLength={80}
                        defaultValue={template.title}
                        label={t("page.name")}
                      />
                      <label
                        htmlFor={`template-body-${template.id}`}
                        className="text-[13.5px] font-semibold"
                      >
                        {t("message.text")}
                      </label>
                      <textarea
                        id={`template-body-${template.id}`}
                        name="body"
                        rows={8}
                        required
                        maxLength={TEMPLATE_BODY_MAX}
                        defaultValue={template.body}
                        className={field}
                      />
                      <Button type="submit" variant="principal" size="M" className="self-start">
                        {t("page.save")}
                      </Button>
                    </form>
                    <form action={deleteTemplateAction}>
                      <input type="hidden" name="template" value={template.id} />
                      <Button type="submit" variant="dangerOutline" size="S">
                        {t("page.delete")}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <p className="mt-3 text-[14px] whitespace-pre-line">{template.body}</p>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}

      {manage && (
        <section aria-labelledby="nouveau-modele" className="rounded-[22px] bg-blanc p-5">
          <h2 id="nouveau-modele" className="mb-3 text-[18px] font-semibold">
            {t("page.new")}
          </h2>
          <form action={saveTemplateAction} className="flex flex-col gap-3">
            <Select
              id="template-kind-new"
              name="kind"
              label={t("page.kind")}
              defaultValue="convocation"
              options={kindOptions}
            />
            <TextField
              id="template-title-new"
              name="title"
              required
              minLength={2}
              maxLength={80}
              label={t("page.name")}
            />
            <label htmlFor="template-body-new" className="text-[13.5px] font-semibold">
              {t("message.text")}
            </label>
            <textarea
              id="template-body-new"
              name="body"
              rows={8}
              required
              maxLength={TEMPLATE_BODY_MAX}
              placeholder={t("page.bodyPlaceholder")}
              className={field}
            />
            <Button type="submit" variant="principal" size="M" className="self-start">
              {t("page.create")}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
