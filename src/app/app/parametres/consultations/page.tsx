import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { SettingsNav } from "@/components/talent/settings-nav";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { shortName } from "@/lib/short-name";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions, type HireContext } from "@/server/services/hire";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhJournal");
  return { title: t("seo"), robots: { index: false } };
}

const DAYS = 90;
const LIMIT = 100;

/** The profiles opened in the organization (or by this member) over the last 90 days. */
async function journal(ctx: HireContext, team: boolean) {
  const since = new Date(Date.now() - DAYS * 86_400_000);
  const views = await db.auditLog.findMany({
    where: {
      organizationId: ctx.organizationId,
      action: "profile.view",
      targetType: "talentProfile",
      createdAt: { gte: since },
      ...(team ? {} : { actorId: ctx.userId }),
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: { id: true, actorId: true, targetId: true, metadata: true, createdAt: true },
  });
  const [actors, profiles] = await Promise.all([
    db.user.findMany({
      where: { id: { in: [...new Set(views.flatMap((view) => view.actorId ?? []))] } },
      select: { id: true, name: true },
    }),
    db.talentProfile.findMany({
      where: { id: { in: [...new Set(views.map((view) => view.targetId))] } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);
  return { views, actors, profiles };
}

/**
 * Journal des consultations (planche recruteur-3 `PARAM_R`): every profile opened in the active
 * organization (golden rule n° 5), filtered by `organizationId`. An administrator sees the whole
 * team; any other member sees the profiles they opened.
 */
export default async function ConsultationsPage() {
  const { ctx, space } = await requireHire("/app/parametres/consultations");
  const t = await getTranslations("rhJournal");
  const tw = await getTranslations("hireWeb3.journal");
  const tp = await getTranslations("parametres");
  const format = await getFormatter();
  const team = hirePermissions(space.role).administer;
  const { views, actors, profiles } = await journal(ctx, team);
  const actorName = new Map(actors.map((actor) => [actor.id, shortName(actor.name)]));
  const profileName = new Map(profiles.map((profile) => [profile.id, profile.user.name]));

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-tel">
        <FlowHead back="/app/parametres" backLabel={t("back")} title={t("title")} />
      </div>
      <h1 className="t-w4-web t-w4-ph1">{tp("title")}</h1>
      <div className="t-w4-prm">
        <SettingsNav on="consultations" />
        <div className="t-w4-col">
          <h2 className="t-w4-web t-w4-h3">{t("title")}</h2>
          <p className="t-aide">{team ? t("introTeam") : t("introOwn")}</p>
          {views.length === 0 ? (
            <p className="t-verre t-vide">{t("empty")}</p>
          ) : (
            <>
              {/* Ordinateur et tablette (planche web recruteur-3 § 7) : le journal en tableau. */}
              <div className="t-verre t-rw3-tbl t-w4-web">
                <table>
                  <caption className="sr-only">{t("title")}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{tw("member")}</th>
                      <th scope="col">{tw("profile")}</th>
                      <th scope="col">{tw("context")}</th>
                      <th scope="col">{tw("when")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {views.map((view) => {
                      const meta = (view.metadata ?? {}) as { source?: string };
                      const actor =
                        view.actorId === ctx.userId
                          ? t("you")
                          : ((view.actorId && actorName.get(view.actorId)) ?? t("formerMember"));
                      return (
                        <tr key={view.id}>
                          <td>{actor}</td>
                          <th scope="row">
                            <b>{profileName.get(view.targetId) ?? t("unknown")}</b>
                          </th>
                          <td>
                            {meta.source === "talent_search"
                              ? t("source.search")
                              : t("source.application")}
                          </td>
                          <td>
                            {format.dateTime(view.createdAt, {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ul aria-label={t("title")} className="t-verre t-liste t-lignes t-w4-tel">
                {views.map((view) => {
                  const meta = (view.metadata ?? {}) as { source?: string };
                  const actor =
                    view.actorId === ctx.userId
                      ? t("you")
                      : ((view.actorId && actorName.get(view.actorId)) ?? t("formerMember"));
                  return (
                    <li key={view.id} className="t-li">
                      <span className="t-cases t-c1" aria-hidden>
                        <TalentIcon name="confidentialite" size="s" />
                      </span>
                      <span className="t-t">
                        <b>{profileName.get(view.targetId) ?? t("unknown")}</b>
                        <span>
                          {t("line", { actor, date: view.createdAt })} ·{" "}
                          {meta.source === "talent_search"
                            ? t("source.search")
                            : t("source.application")}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="t-gar">
            <TalentIcon name="cadenas" size="s" />
            <span>{t("rule")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
