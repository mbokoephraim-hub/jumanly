import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { deleteTemplateAction, saveTemplateAction } from "@/server/actions/hire-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import {
  listTemplates,
  TEMPLATE_BODY_MAX,
  templateKinds,
  type TemplateKind,
} from "@/server/services/message-templates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.templates");
  return { title: t("page.title"), robots: { index: false } };
}

const look: Record<
  TemplateKind,
  { icon: "agenda" | "document" | "horloge" | "valider" | "message"; tone: string }
> = {
  convocation: { icon: "agenda", tone: "t-c2" },
  document: { icon: "document", tone: "t-c1" },
  relance: { icon: "horloge", tone: "" },
  acceptation: { icon: "valider", tone: "t-c3" },
  refus: { icon: "message", tone: "" },
};

/**
 * The organization's message templates (planche recruteur-3 `MODELES`): each type with the
 * organization's own text or Jumanly's, a sheet to write or change one, and the rule: a template
 * is inserted in the message, read, then sent by the recruiter. Only this organization's
 * templates are listed and edited (golden rule n° 6).
 */
export default async function TemplatesPage({ searchParams }: PageProps<"/app/hire/modeles">) {
  const query = await searchParams;
  const { ctx } = await requireHire("/app/hire/modeles", "readApplications");
  const t = await getTranslations("hire.templates");
  const tr = await getTranslations("rhTemplates");
  const templates = await listTemplates(db, ctx);
  const manage = hirePermissions(ctx.role).manage;
  const missing = templateKinds.filter((kind) => !templates.some((row) => row.kind === kind));

  const fields = (id: string, current?: { kind: TemplateKind; title: string; body: string }) => (
    <>
      <div className="t-champ">
        <label htmlFor={`${id}-kind`}>{t("page.kind")}</label>
        <span className="t-verre t-saisie">
          <select id={`${id}-kind`} name="kind" defaultValue={current?.kind ?? "convocation"}>
            {templateKinds.map((kind) => (
              <option key={kind} value={kind}>
                {t(`kind.${kind}`)}
              </option>
            ))}
          </select>
        </span>
      </div>
      <div className="t-champ">
        <label htmlFor={`${id}-title`}>{t("page.name")}</label>
        <span className="t-verre t-saisie">
          <input
            id={`${id}-title`}
            name="title"
            required
            minLength={2}
            maxLength={80}
            defaultValue={current?.title}
          />
        </span>
      </div>
      <div className="t-champ">
        <label htmlFor={`${id}-body`}>{t("message.text")}</label>
        <textarea
          id={`${id}-body`}
          name="body"
          rows={8}
          required
          maxLength={TEMPLATE_BODY_MAX}
          defaultValue={current?.body}
          placeholder={t("page.bodyPlaceholder")}
          className="t-verre t-zone"
          aria-describedby={`${id}-h`}
        />
        <p id={`${id}-h`} className="t-aide">
          {t("page.placeholders")}
        </p>
      </div>
    </>
  );

  return (
    <div className="t-flux">
      <FlowHead back="/app/messages" backLabel={tr("back")} title={t("page.title")} />
      <p className="t-r5-sous">{t("page.subtitle")}</p>
      {query.ok === "enregistre" && <Notice tone="ok">{t("page.saved")}</Notice>}
      {query.ok === "supprime" && <Notice tone="ok">{t("page.deleted")}</Notice>}
      {query.erreur === "1" && <Notice tone="err">{t("page.error")}</Notice>}

      {templates.length > 0 && (
        <section aria-labelledby="r5-mod-org" className="t-flux t-serre">
          <h2 id="r5-mod-org" className="t-ck-t">
            {tr("own")}
          </h2>
          <ul className="t-verre t-liste t-lignes">
            {templates.map((template) => (
              <li key={template.id}>
                <SheetButton target={`r5-mod-${template.id}`} className="t-li t-press">
                  <span className={cx("t-cases", look[template.kind].tone)} aria-hidden>
                    <TalentIcon name={look[template.kind].icon} size="s" />
                  </span>
                  <span className="t-t">
                    <b>{template.title}</b>
                    <span>{t(`kind.${template.kind}`)}</span>
                  </span>
                  <TalentIcon name="suivant" />
                </SheetButton>
              </li>
            ))}
          </ul>
        </section>
      )}

      {missing.length > 0 && (
        <section aria-labelledby="r5-mod-jm" className="t-flux t-serre">
          <h2 id="r5-mod-jm" className="t-ck-t">
            {tr("jumanly")}
          </h2>
          <ul className="t-verre t-liste t-lignes">
            {missing.map((kind) => (
              <li key={kind} className="t-li">
                <span className={cx("t-cases", look[kind].tone)} aria-hidden>
                  <TalentIcon name={look[kind].icon} size="s" />
                </span>
                <span className="t-t">
                  <b>{t(`kind.${kind}`)}</b>
                  <span>{tr(`default.${kind}`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {manage && (
        <SheetButton target="r5-mod-nouveau" className="t-ajout t-press">
          <TalentIcon name="plus" size="s" />
          {tr("create")}
        </SheetButton>
      )}

      <p className="t-gar">
        <TalentIcon name="modifier" size="s" />
        <span>{tr("rule")}</span>
      </p>

      {templates.map((template) => (
        <Sheet
          key={template.id}
          id={`r5-mod-${template.id}`}
          title={template.title}
          closeLabel={tr("close")}
        >
          {manage ? (
            <div className="t-flux">
              <form action={saveTemplateAction} className="t-flux">
                <input type="hidden" name="template" value={template.id} />
                {fields(`r5-m-${template.id}`, template)}
                <button type="submit" className="t-bt t-p t-m t-pl t-press">
                  {t("page.save")}
                </button>
              </form>
              <form action={deleteTemplateAction}>
                <input type="hidden" name="template" value={template.id} />
                <button type="submit" className="t-bt t-sec t-m t-pl t-press t-r5-danger">
                  {t("page.delete")}
                </button>
              </form>
            </div>
          ) : (
            <p className="t-texte-l t-r5-pre">{template.body}</p>
          )}
        </Sheet>
      ))}

      {manage && (
        <Sheet
          id="r5-mod-nouveau"
          title={t("page.new")}
          closeLabel={tr("close")}
          openParam="nouveau"
          defaultOpen={query.nouveau === "1"}
        >
          <form action={saveTemplateAction} className="t-flux">
            {fields("r5-m-nouveau")}
            <button type="submit" className="t-bt t-p t-m t-pl t-press">
              {t("page.create")}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
