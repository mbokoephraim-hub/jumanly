import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  createEntityAction,
  createTeamAction,
  deleteEntityAction,
  deleteTeamAction,
} from "@/server/actions/organization";
import type { orgStructure } from "@/server/services/org-structure";

type Structure = Awaited<ReturnType<typeof orgStructure>>;
type Member = { userId: string; user: { name: string } };

/** Without the right: what it opens, and the way to the plans (or to a quote for the entities). */
async function Locked({ text, quote }: { text: string; quote?: boolean }) {
  const t = await getTranslations("org");
  const ts = await getTranslations("orgStructure");
  return (
    <section className="ae-carte ae-rg-carte">
      <p>{text}</p>
      <Link
        href={quote ? "/contact?sujet=devis" : "/app/organisation/facturation"}
        className="ae-btn2 ae-btn-m ae-rg-lien"
      >
        {quote ? t("entities.quote") : ts("lockedLink")}
      </Link>
    </section>
  );
}

/** « Supprimer », opened then confirmed, without a script. */
function Remove({
  action,
  confirm,
  label,
  fields,
}: {
  action: (formData: FormData) => Promise<void>;
  confirm: string;
  label: string;
  fields: Record<string, string>;
}) {
  return (
    <details className="ae-st-suppr">
      <summary className="ae-btn2 ae-btn-s">{label}</summary>
      <form action={action} className="ae-st-confirmer">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <p>{confirm}</p>
        <button type="submit" className="ae-btn2 ae-btn-s ae-st-danger">
          {label}
        </button>
      </form>
    </details>
  );
}

/** « Équipes » and « Départements » (`org.teams`). */
export async function TeamsPanel({
  kind,
  structure,
  members,
  entities,
  lockedPlan,
}: {
  kind: "team" | "department";
  structure: Structure | null;
  members: Member[];
  entities: boolean;
  lockedPlan: string | null;
}) {
  const t = await getTranslations("org");
  const prefix = kind === "team" ? "teams" : "departments";
  if (!structure) return <Locked text={t(`${prefix}.locked`, { plan: lockedPlan ?? "" })} />;
  const items = kind === "team" ? structure.teams : structure.departments;
  return (
    <div className="ae-st-grille">
      <section className="ae-carte ae-rg-carte" aria-labelledby={`st-${kind}`}>
        <h2 id={`st-${kind}`} className="ae-h2">
          {t(`${prefix}.title`)}
        </h2>
        {items.length === 0 ? (
          <p className="ae-meta ae-rg-vide">{t(`${prefix}.empty`)}</p>
        ) : (
          <ul className="ae-rg-liste">
            {items.map((item) => (
              <li key={item.id} className="ae-st-ligne">
                <span className="ae-grandit">
                  <b>{item.name}</b>
                  <span className="ae-meta ae-st-meta">
                    {[
                      t("teams.members", { count: item._count.memberships }),
                      t("teams.jobs", { count: item._count.jobs }),
                      item.entity?.name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <Remove
                  action={deleteTeamAction}
                  label={t("structure.delete")}
                  fields={{ id: item.id, kind }}
                  confirm={
                    kind === "team"
                      ? t("teams.delete.confirm", { team: item.name })
                      : t("departments.delete.confirm", { department: item.name })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="ae-carte ae-rg-carte" aria-labelledby={`st-${kind}-new`}>
        <h2 id={`st-${kind}-new`} className="ae-h2">
          {t(`${prefix}.new`)}
        </h2>
        <form action={createTeamAction}>
          <input type="hidden" name="kind" value={kind} />
          <label htmlFor={`st-${kind}-name`} className="ae-lab">
            {t(`${prefix}.name.text`)}
          </label>
          <input
            id={`st-${kind}-name`}
            name="name"
            required
            minLength={2}
            maxLength={80}
            className="ae-in"
            placeholder={t(`${prefix}.name.placeholder`)}
          />
          <label htmlFor={`st-${kind}-lead`} className="ae-lab">
            {t("teams.lead")}
          </label>
          <select id={`st-${kind}-lead`} name="lead" className="ae-in ae-pe-select">
            <option value="">{t("teams.noLead")}</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
          {entities && structure.entities.length > 0 && (
            <>
              <label htmlFor={`st-${kind}-entity`} className="ae-lab">
                {t("teams.entity")}
              </label>
              <select id={`st-${kind}-entity`} name="entity" className="ae-in ae-pe-select">
                <option value="">{t("entities.noParent")}</option>
                {structure.entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <button type="submit" className="ae-btn ae-btn-m ae-st-creer">
            {t("structure.create")}
          </button>
        </form>
      </section>
    </div>
  );
}

/** « Entités » (`org.entities`): subsidiaries inside one organization. */
export async function EntitiesPanel({
  structure,
  lockedPlan,
}: {
  structure: Structure | null;
  lockedPlan: string | null;
}) {
  const t = await getTranslations("org");
  if (!structure || lockedPlan)
    return <Locked text={t("entities.locked", { plan: lockedPlan ?? "" })} quote />;
  return (
    <div className="ae-st-grille">
      <section className="ae-carte ae-rg-carte" aria-labelledby="st-entities">
        <h2 id="st-entities" className="ae-h2">
          {t("entities.title")}
        </h2>
        {structure.entities.length === 0 ? (
          <p className="ae-meta ae-rg-vide">{t("entities.empty")}</p>
        ) : (
          <ul className="ae-rg-liste">
            {structure.entities.map((entity) => (
              <li key={entity.id} className="ae-st-ligne">
                <span className="ae-grandit">
                  <b>{entity.name}</b>
                  <span className="ae-meta ae-st-meta">
                    {[
                      entity.country,
                      entity.parent ? t("entities.parentOf", { entity: entity.parent.name }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {entity.verifiedAt && (
                  <span className="ae-tag ae-tag-lime">{t("entities.verified")}</span>
                )}
                <Remove
                  action={deleteEntityAction}
                  label={t("structure.delete")}
                  fields={{ id: entity.id }}
                  confirm={t("entities.delete.confirm", { entity: entity.name })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="ae-carte ae-rg-carte" aria-labelledby="st-entities-new">
        <h2 id="st-entities-new" className="ae-h2">
          {t("entities.new")}
        </h2>
        <form action={createEntityAction}>
          <label htmlFor="st-entity-name" className="ae-lab">
            {t("entities.name")}
          </label>
          <input
            id="st-entity-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            className="ae-in"
          />
          <label htmlFor="st-entity-country" className="ae-lab">
            {t("entities.country")}
          </label>
          <input
            id="st-entity-country"
            name="country"
            maxLength={2}
            className="ae-in"
            aria-describedby="st-entity-country-h"
          />
          <p id="st-entity-country-h" className="ae-meta ae-note">
            {t("profile.countryHint")}
          </p>
          <label htmlFor="st-entity-parent" className="ae-lab">
            {t("entities.parent")}
          </label>
          <select id="st-entity-parent" name="parent" className="ae-in ae-pe-select">
            <option value="">{t("entities.noParent")}</option>
            {structure.entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          <button type="submit" className="ae-btn ae-btn-m ae-st-creer">
            {t("structure.create")}
          </button>
        </form>
      </section>
    </div>
  );
}
