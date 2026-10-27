import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { adminCard, adminLabel, adminTitle, Tag } from "@/components/admin/kit";
import { Alert, Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  addSkillAliasAction,
  mergeSkillAction,
  removeSkillAliasAction,
} from "@/server/actions/skills-admin";
import { db } from "@/server/db";
import { CUSTOM_SKILL_CATEGORY } from "@/server/services/profile";
import { referentialNames, skillsOverview, type SkillFilter } from "@/server/services/skills-admin";

const OK = ["alias", "aliasRemoved", "merged"] as const;
const ERRORS = ["champs", "notFound", "same", "alias"] as const;

const field =
  "h-10 w-full rounded-[12px] bg-blanc px-3 text-[13px] ring-[1.5px] ring-brume ring-inset focus:ring-2 focus:ring-lime focus:outline-none";

/**
 * « IA et matching › Compétences » (27/10/2026): the skills people typed themselves and the
 * referential, with synonyms and merges so that the score recognizes every spelling. Counts only.
 */
export async function SkillsTab({
  params,
  writable,
}: {
  params: Record<string, string | string[] | undefined>;
  writable: boolean;
}) {
  const t = await getTranslations("admin.ai.skills");
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const filter: SkillFilter = one("vue") === "tout" ? "all" : "custom";
  const q = one("q").trim().slice(0, 80);
  const [{ rows, total, custom }, names] = await Promise.all([
    skillsOverview(db, { filter, q }),
    writable ? referentialNames(db) : Promise.resolve([]),
  ]);
  const base = `/admin/ia?onglet=competences${filter === "all" ? "&vue=tout" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const done = OK.find((value) => value === one("ok"));
  const error = ERRORS.find((value) => value === one("erreur"));

  return (
    <section aria-labelledby="ia-skills-title" className="flex flex-col gap-4">
      <div className={cx(adminCard, "flex flex-col gap-2")}>
        <h2 id="ia-skills-title" className={adminTitle}>
          {t("title")}
        </h2>
        <p className="text-[13px] leading-5 text-ardoise">{t("intro")}</p>
      </div>

      {done && <Alert tone="success" title={t(`ok.${done}`)} />}
      {error && <Alert tone="error" title={t(`error.${error}`)} />}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["custom", t("filter.custom", { count: custom })],
            ["all", t("filter.all")],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/ia?onglet=competences${value === "all" ? "&vue=tout" : ""}`}
            aria-current={filter === value ? "page" : undefined}
            className={cx(
              "inline-flex h-9 items-center rounded-pill px-4 text-[13px] font-semibold",
              filter === value ? "bg-lime text-sapin" : "bg-blanc ring-1 ring-brume ring-inset",
            )}
          >
            {label}
          </Link>
        ))}
        <form action="/admin/ia" className="ml-auto flex min-w-[220px] items-center gap-2">
          <input type="hidden" name="onglet" value="competences" />
          {filter === "all" && <input type="hidden" name="vue" value="tout" />}
          <label htmlFor="ia-skills-q" className="sr-only">
            {t("search")}
          </label>
          <input
            id="ia-skills-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("search")}
            className={field}
          />
        </form>
      </div>

      <p className="text-[12px] text-ardoise">{t("count", { shown: rows.length, total })}</p>

      {rows.length === 0 ? (
        <p className={cx(adminCard, "text-[13px] text-ardoise")}>{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((skill) => (
            <li key={skill.id} className={cx(adminCard, "flex flex-col gap-3 py-4!")}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] leading-5 font-semibold">{skill.name}</h3>
                {skill.category === CUSTOM_SKILL_CATEGORY && (
                  <Tag tone="warning">{t("custom")}</Tag>
                )}
                <span className="ml-auto text-[12px] text-ardoise">
                  {t("usage", {
                    profiles: skill._count.profiles,
                    jobs: skill._count.jobs,
                    courses: skill._count.courses,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={adminLabel}>{t("aliases")}</span>
                {skill.aliases.length === 0 && (
                  <span className="text-[12px] text-ardoise">{t("noAlias")}</span>
                )}
                {skill.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex h-7 items-center gap-1 rounded-pill bg-creme pr-1 pl-3 text-[12px]"
                  >
                    {alias}
                    {writable && (
                      <form action={removeSkillAliasAction}>
                        <input type="hidden" name="skillId" value={skill.id} />
                        <input type="hidden" name="alias" value={alias} />
                        <input type="hidden" name="back" value={base} />
                        <button
                          type="submit"
                          aria-label={t("removeAlias", { alias })}
                          className="grid size-5 place-items-center rounded-full hover:bg-brume"
                        >
                          <Icon name="fermer" className="size-3" />
                        </button>
                      </form>
                    )}
                  </span>
                ))}
              </div>
              {writable && (
                <details className="group">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold hover:underline [&::-webkit-details-marker]:hidden">
                    <Icon name="edit" className="size-4" />
                    {t("improve")}
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <form
                      action={addSkillAliasAction}
                      className="flex flex-col gap-2 rounded-[16px] bg-creme p-3.5"
                    >
                      <p className="text-[13px] font-semibold">{t("addAlias.title")}</p>
                      <p className="text-[12px] leading-4 text-ardoise">{t("addAlias.hint")}</p>
                      <input type="hidden" name="skillId" value={skill.id} />
                      <input type="hidden" name="back" value={base} />
                      <label htmlFor={`alias-${skill.id}`} className="sr-only">
                        {t("addAlias.label")}
                      </label>
                      <input
                        id={`alias-${skill.id}`}
                        name="alias"
                        required
                        minLength={2}
                        maxLength={80}
                        placeholder={t("addAlias.label")}
                        className={field}
                      />
                      <label htmlFor={`alias-reason-${skill.id}`} className="sr-only">
                        {t("reason")}
                      </label>
                      <input
                        id={`alias-reason-${skill.id}`}
                        name="reason"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder={t("reason")}
                        className={field}
                      />
                      <Button type="submit" size="sm" className="self-start">
                        {t("addAlias.submit")}
                      </Button>
                    </form>
                    <form
                      action={mergeSkillAction}
                      className="flex flex-col gap-2 rounded-[16px] bg-creme p-3.5"
                    >
                      <p className="text-[13px] font-semibold">{t("merge.title")}</p>
                      <p className="text-[12px] leading-4 text-ardoise">{t("merge.hint")}</p>
                      <input type="hidden" name="skillId" value={skill.id} />
                      <input type="hidden" name="back" value={base} />
                      <label htmlFor={`merge-${skill.id}`} className="sr-only">
                        {t("merge.label")}
                      </label>
                      <input
                        id={`merge-${skill.id}`}
                        name="target"
                        required
                        list="ia-skills-names"
                        minLength={2}
                        maxLength={80}
                        placeholder={t("merge.label")}
                        className={field}
                      />
                      <label htmlFor={`merge-reason-${skill.id}`} className="sr-only">
                        {t("reason")}
                      </label>
                      <input
                        id={`merge-reason-${skill.id}`}
                        name="reason"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder={t("reason")}
                        className={field}
                      />
                      <Button type="submit" size="sm" variant="secondary" className="self-start">
                        {t("merge.submit")}
                      </Button>
                    </form>
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
      {writable && (
        <datalist id="ia-skills-names">
          {names.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}
    </section>
  );
}
