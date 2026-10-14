import { getTranslations } from "next-intl/server";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  PlanLock,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import type { Organization } from "@/generated/prisma/client";
import {
  createEntityAction,
  createTeamAction,
  deleteEntityAction,
  deleteTeamAction,
  requestVerificationAction,
} from "@/server/actions/organization";
import type { orgStructure } from "@/server/services/org-structure";

type Structure = Awaited<ReturnType<typeof orgStructure>>;
type Member = { userId: string; user: { name: string } };

/** « Équipes » and « Départements » tabs (`org.teams`). */
export async function TeamsTab({
  kind,
  structure,
  members,
  admin,
  entities,
  lockedPlan,
}: {
  kind: "team" | "department";
  structure: Structure | null;
  members: Member[];
  admin: boolean;
  entities: boolean;
  lockedPlan: string | null;
}) {
  const t = await getTranslations("org");
  const prefix = kind === "team" ? "teams" : "departments";
  if (!structure)
    return (
      <PlanLock
        plan={lockedPlan ?? ""}
        description={t(`${prefix}.locked`, { plan: lockedPlan ?? "" })}
      />
    );
  const items = kind === "team" ? structure.teams : structure.departments;
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="text-h2">{t(`${prefix}.title`)}</h2>
        {items.length === 0 ? (
          <EmptyState title={t(`${prefix}.empty`)} />
        ) : (
          <ul className="flex flex-col divide-y divide-brume">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-sm text-ardoise">
                    {[
                      t("teams.members", { count: item._count.memberships }),
                      t("teams.jobs", { count: item._count.jobs }),
                      item.entity?.name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                {admin && (
                  <details>
                    <summary className="cursor-pointer text-sm underline">
                      {t("structure.delete")}
                    </summary>
                    <form
                      action={deleteTeamAction}
                      className="mt-2 flex flex-col items-start gap-2 rounded-md bg-creme p-3"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="kind" value={kind} />
                      <p className="text-sm">
                        {kind === "team"
                          ? t("teams.delete.confirm", { team: item.name })
                          : t("departments.delete.confirm", { department: item.name })}
                      </p>
                      <Button type="submit" variant="danger" size="sm">
                        {t("structure.delete")}
                      </Button>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {admin && (
        <section className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          <h2 className="text-h2">{t(`${prefix}.new`)}</h2>
          <form action={createTeamAction} className="flex flex-col gap-4">
            <input type="hidden" name="kind" value={kind} />
            <TextField
              id={`${kind}-name`}
              name="name"
              required
              minLength={2}
              maxLength={80}
              label={t(`${prefix}.name.text`)}
              placeholder={t(`${prefix}.name.placeholder`)}
            />
            <Select
              id={`${kind}-lead`}
              name="lead"
              label={t("teams.lead")}
              placeholder={t("teams.noLead")}
              options={members.map((member) => ({ value: member.userId, label: member.user.name }))}
            />
            {entities && structure.entities.length > 0 && (
              <Select
                id={`${kind}-entity`}
                name="entity"
                label={t("teams.entity")}
                placeholder={t("entities.noParent")}
                options={structure.entities.map((entity) => ({
                  value: entity.id,
                  label: entity.name,
                }))}
              />
            )}
            <Button type="submit" className="self-start">
              {t("structure.create")}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

/** « Entités » tab (`org.entities`, Company Premium): subsidiaries inside one organization. */
export async function EntitiesTab({
  structure,
  admin,
  lockedPlan,
}: {
  structure: Structure | null;
  admin: boolean;
  lockedPlan: string | null;
}) {
  const t = await getTranslations("org");
  if (!structure || lockedPlan)
    return (
      <div className="flex flex-col gap-4">
        <PlanLock
          plan={lockedPlan ?? ""}
          description={t("entities.locked", { plan: lockedPlan ?? "" })}
        />
        <ButtonLink href="/contact?sujet=devis" variant="secondary" className="self-start">
          {t("entities.quote")}
        </ButtonLink>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="text-h2">{t("entities.title")}</h2>
        {structure.entities.length === 0 ? (
          <EmptyState title={t("entities.empty")} />
        ) : (
          <ul className="flex flex-col divide-y divide-brume">
            {structure.entities.map((entity) => (
              <li key={entity.id} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{entity.name}</span>
                  <span className="flex items-center gap-2 text-sm text-ardoise">
                    {[
                      entity.country,
                      entity.parent ? t("entities.parentOf", { entity: entity.parent.name }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {entity.verifiedAt && <Badge tone="success">{t("entities.verified")}</Badge>}
                  </span>
                </div>
                {admin && (
                  <details>
                    <summary className="cursor-pointer text-sm underline">
                      {t("structure.delete")}
                    </summary>
                    <form
                      action={deleteEntityAction}
                      className="mt-2 flex flex-col items-start gap-2 rounded-md bg-creme p-3"
                    >
                      <input type="hidden" name="id" value={entity.id} />
                      <p className="text-sm">
                        {t("entities.delete.confirm", { entity: entity.name })}
                      </p>
                      <Button type="submit" variant="danger" size="sm">
                        {t("structure.delete")}
                      </Button>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {admin && (
        <section className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          <h2 className="text-h2">{t("entities.new")}</h2>
          <form action={createEntityAction} className="flex flex-col gap-4">
            <TextField
              id="entity-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              label={t("entities.name")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="entity-country"
                name="country"
                maxLength={2}
                label={t("entities.country")}
                hint={t("profile.countryHint")}
              />
              <Select
                id="entity-parent"
                name="parent"
                label={t("entities.parent")}
                placeholder={t("entities.noParent")}
                options={structure.entities.map((entity) => ({
                  value: entity.id,
                  label: entity.name,
                }))}
              />
            </div>
            <Button type="submit" className="self-start">
              {t("structure.create")}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

/** « Vérification » tab (`org.verified_profile`): request, status and reason of a refusal. */
export async function VerificationTab({
  organization,
  admin,
  lockedPlan,
  days,
}: {
  organization: Pick<
    Organization,
    "verificationStatus" | "verifiedAt" | "verificationReason" | "verificationRequest"
  >;
  admin: boolean;
  lockedPlan: string | null;
  days: number;
}) {
  const t = await getTranslations("org.verification");
  const status = organization.verificationStatus;
  const previous = (organization.verificationRequest ?? {}) as Record<string, string>;
  return (
    <section className="flex max-w-3xl flex-col gap-4 rounded-card bg-blanc p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2">{t("title")}</h2>
        <p className="text-ardoise">{t("subtitle")}</p>
      </div>
      <p>
        <Badge tone={status === "verified" ? "success" : "neutral"}>{t(`status.${status}`)}</Badge>
      </p>
      {status === "verified" && organization.verifiedAt && (
        <p className="text-sm">{t("verifiedOn", { date: organization.verifiedAt })}</p>
      )}
      {status === "pending" && <p className="text-sm">{t("submitted", { days })}</p>}
      {status === "rejected" && organization.verificationReason && (
        <p className="text-sm">
          {t("rejected.reason", { reason: organization.verificationReason })}
        </p>
      )}
      {lockedPlan ? (
        <PlanLock plan={lockedPlan} description={t("locked", { plan: lockedPlan })} />
      ) : (
        admin &&
        (status === "none" || status === "rejected") && (
          <form action={requestVerificationAction} className="flex flex-col gap-4">
            <p className="font-medium">{t("docs")}</p>
            <TextField
              id="verify-registration"
              name="registration"
              required
              minLength={3}
              maxLength={200}
              label={t("form.registration")}
              defaultValue={previous.registration ?? ""}
            />
            <TextField
              id="verify-tax"
              name="taxId"
              maxLength={120}
              label={t("form.taxId")}
              defaultValue={previous.taxId ?? ""}
            />
            <TextField
              id="verify-domain"
              name="domainEmail"
              type="email"
              maxLength={200}
              label={t("form.domainEmail")}
              defaultValue={previous.domainEmail ?? ""}
            />
            <TextArea
              id="verify-mandate"
              name="mandate"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              label={t("form.mandate")}
              hint={t("form.mandateHint")}
              defaultValue={previous.mandate ?? ""}
            />
            <Button type="submit" className="self-start">
              {status === "rejected" ? t("resubmit") : t("submit")}
            </Button>
          </form>
        )
      )}
    </section>
  );
}
