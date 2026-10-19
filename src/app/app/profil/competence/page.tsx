import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { removeSkill, saveSkill } from "@/server/actions/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { talentAttestations } from "@/server/services/attestations";
import { listProjects } from "@/server/services/portfolio";
import { ensureProfile, normalize } from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.skills");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const levels = [
  [1, "beginner"],
  [2, "intermediate"],
  [3, "advanced"],
] as const;

/**
 * « Compétences » (planche talent-4, profil : édition): find the skill in the reference list,
 * choose the level, then what proves it: one of my attestations, one of my projects, or nothing.
 */
export default async function SkillPage({ searchParams }: PageProps<"/app/profil/competence">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil/competence");
  const t = await getTranslations();
  const profile = await ensureProfile(db, user.id);
  const id = one(params.id);
  const current = id
    ? await db.profileSkill.findFirst({
        where: { id, profileId: profile.id },
        include: { skill: { select: { name: true } } },
      })
    : null;
  const q = (one(params.q) ?? "").trim().slice(0, 80);
  const [found, attestations, projects] = await Promise.all([
    q.length >= 2
      ? db.skill.findMany({
          where: {
            OR: [{ name: { contains: q, mode: "insensitive" } }, { aliases: { has: q } }],
          },
          orderBy: { name: "asc" },
          take: 8,
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    talentAttestations(db, user.id),
    listProjects(db, profile.id),
  ]);
  // The exact match first: « sql » → SQL, then SQL avancé, PostgreSQL.
  const wanted = normalize(q);
  const matches = [...found].sort(
    (a, b) => Number(normalize(b.name) === wanted) - Number(normalize(a.name) === wanted),
  );
  const chosen = current?.skill.name ?? matches[0]?.name;
  const level = Math.min(current?.level ?? 2, 4);
  const proof = current?.proofRef
    ? `${current.proof}:${current.proofRef}`
    : current?.proof
      ? "keep"
      : "";
  const error = one(params.erreur);

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/profil?section=competences#competences"
        backLabel={t("profil.back")}
        title={t("profil.skills.title")}
      />
      {error && (
        <Notice tone="err">
          {error === "unknownSkill" || error === "max"
            ? t(`profil.skills.error.${error}`)
            : t("profil.error")}
        </Notice>
      )}

      {!current && (
        <form action="/app/profil/competence" className="t-verre t-rech" role="search">
          <TalentIcon name="recherche" size="s" />
          <label htmlFor="pf-sk-q" className="sr-only">
            {t("profil.skills.search")}
          </label>
          <input
            id="pf-sk-q"
            name="q"
            type="search"
            defaultValue={q}
            minLength={2}
            maxLength={80}
            placeholder={t("profil.skills.search")}
            autoComplete="off"
          />
        </form>
      )}

      <form id="pf-sk" action={saveSkill} className="t-flux">
        <input type="hidden" name="retour" value="/app/profil/competence" />
        {current && <input type="hidden" name="id" value={current.id} />}
        {q && <input type="hidden" name="q" value={q} />}
        {current ? (
          <input type="hidden" name="skill" value={current.skill.name} />
        ) : q && matches.length === 0 ? (
          <p className="t-vide-t">{t("profil.skills.none", { query: q })}</p>
        ) : (
          matches.length > 0 && (
            <fieldset className="t-fs">
              <legend className="sr-only">{t("profil.skills.pick")}</legend>
              <div className="t-puces">
                {matches.map((skill, index) => (
                  <label key={skill.id} className="t-puce t-press">
                    <input
                      type="radio"
                      name="skill"
                      value={skill.name}
                      defaultChecked={index === 0}
                      required
                    />
                    <TalentIcon name="valider" size="xs" />
                    {skill.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )
        )}
        {current && <p className="t-h2s">{current.skill.name}</p>}

        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.skills.level")}</legend>
          <div className="t-seg">
            {levels.map(([value, key]) => (
              <label key={value}>
                <input type="radio" name="level" value={value} defaultChecked={level === value} />
                {t(`profil.skills.levels.${key}`)}
              </label>
            ))}
            {level === 4 && (
              <label>
                <input type="radio" name="level" value={4} defaultChecked />
                {t("profil.skills.levels.expert")}
              </label>
            )}
          </div>
        </fieldset>

        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.skills.proof")}</legend>
          <div className="t-verre t-liste t-lignes t-choix-l">
            {current?.proof && !current.proofRef && (
              <label className="t-li">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="valider" size="s" />
                </span>
                <span className="t-t">
                  <b>{t(`profil.proof.${current.proof === "link" ? "link" : "experience"}`)}</b>
                  <span>{t("profil.skills.keepProof")}</span>
                </span>
                <input type="radio" name="preuve" value="keep" defaultChecked className="sr-only" />
                <span className="t-radio" aria-hidden />
              </label>
            )}
            {attestations.map((attestation) => (
              <label key={attestation.id} className="t-li">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="certificat" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("profil.skills.attestation")}</b>
                  <span>{attestation.courseTitle}</span>
                </span>
                <input
                  type="radio"
                  name="preuve"
                  value={`certificate:${attestation.id}`}
                  defaultChecked={proof === `certificate:${attestation.id}`}
                  className="sr-only"
                />
                <span className="t-radio" aria-hidden />
              </label>
            ))}
            {projects.map((project) => (
              <label key={project.id} className="t-li">
                <span className="t-cases t-c3" aria-hidden>
                  <TalentIcon name="realisation" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("profil.skills.project")}</b>
                  <span>{project.title}</span>
                </span>
                <input
                  type="radio"
                  name="preuve"
                  value={`project:${project.id}`}
                  defaultChecked={proof === `project:${project.id}`}
                  className="sr-only"
                />
                <span className="t-radio" aria-hidden />
              </label>
            ))}
            <label className="t-li">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="modifier" size="s" />
              </span>
              <span className="t-t">
                <b>{t("profil.skills.declared")}</b>
                <span>{t("profil.skills.declaredText")}</span>
              </span>
              <input
                type="radio"
                name="preuve"
                value=""
                defaultChecked={proof === ""}
                className="sr-only"
              />
              <span className="t-radio" aria-hidden />
            </label>
          </div>
        </fieldset>
        {current?.verified && <p className="t-vide-t">{t("profil.skills.verified")}</p>}
      </form>

      {current && (
        <form action={removeSkill}>
          <input type="hidden" name="id" value={current.id} />
          <button type="submit" className="t-bt t-sec t-pl t-danger t-press">
            {t("profil.skills.remove")}
          </button>
        </form>
      )}

      <div className="t-verre t-fort t-bas-f">
        <button type="submit" form="pf-sk" disabled={!chosen} className="t-bt t-p t-pl t-press">
          {current
            ? t("profil.save")
            : matches.length === 1 && chosen
              ? t("profil.skills.addNamed", { skill: chosen })
              : t("profil.skills.add")}
        </button>
      </div>
    </div>
  );
}
