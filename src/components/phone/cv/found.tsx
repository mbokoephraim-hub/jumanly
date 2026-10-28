import "server-only";
import { getTranslations } from "next-intl/server";
import { languageName } from "@/lib/dates";
import { PROFILE_PALETTE, colorOf } from "@/lib/profile-colors";
import { newCareerCvAction } from "@/server/actions/career-phone";
import {
  keepImportedCvAction,
  newCvFromImportAction,
  profileFromImportAction,
} from "@/server/actions/cv-flow";
import { normalize, parseProfileLanguages, type getFullProfile } from "@/server/services/profile";
import type { ImportPayload } from "@/server/services/cv-import";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { CvMark } from "./marks";

type Profile = Awaited<ReturnType<typeof getFullProfile>>;
type Group = {
  key: "contact" | "experiences" | "educations" | "skills" | "languages";
  title: string;
  chips: { text: string; color: string }[];
  state: string;
  fresh: boolean;
};

const label = (code: string) => {
  const name = languageName(code);
  return name.charAt(0).toLocaleUpperCase("fr") + name.slice(1);
};

/**
 * « Voici ce qu’Orbi a trouvé » (capture 15): what the file holds, group by group, each one
 * marked « nouveau » or « déjà là » against the profile, ticked by default. Then three ways
 * (Ephraïm, 27/10): keep the CV as it is, fill the profile with the groups left ticked (the CV is
 * kept too), or make a new CV in Jumanly from what was read. Nothing enters the profile without
 * that tap.
 */
export async function CvFound({
  importId,
  read,
  profile,
}: {
  importId: string;
  read: ImportPayload;
  profile: Profile;
}) {
  const t = await getTranslations("phoneCv.found");
  const tc = await getTranslations("phoneCv");
  const state = (fresh: number, all: number, word: "one" | "many") =>
    fresh === 0
      ? t("already")
      : fresh === all
        ? t("new")
        : word === "many"
          ? t("newMany", { count: fresh })
          : t("newSome", { count: fresh });
  const key = (...parts: string[]) => parts.map(normalize).join("|");

  const experiencesKnown = new Set(
    profile.experiences.map((item) => key(item.title, item.company)),
  );
  const educationsKnown = new Set(profile.educations.map((item) => key(item.degree, item.school)));
  const skillsKnown = new Set(profile.skills.map((item) => normalize(item.skill.name)));
  const languagesKnown = new Set(parseProfileLanguages(profile.languages).map((item) => item.code));
  const freshExperiences = read.experiences.filter(
    (item) => item.start && !experiencesKnown.has(key(item.title, item.company)),
  ).length;
  const freshEducations = read.educations.filter(
    (item) => !educationsKnown.has(key(item.degree, item.school)),
  ).length;
  const freshSkills = read.skills.filter((name) => !skillsKnown.has(normalize(name))).length;
  const freshLanguages = read.languages.filter((code) => !languagesKnown.has(code)).length;
  const chip = (text: string, color = PROFILE_PALETTE[colorOf(text)]) => ({ text, color });

  const contact = [read.contact.name, read.contact.email, read.contact.city].filter(
    (value): value is string => Boolean(value),
  );
  const cityFresh = Boolean(read.contact.city && !profile.user.city);
  const groups = (
    [
      contact.length > 0 && {
        key: "contact" as const,
        title: t("contact"),
        chips: contact.map((text) => chip(text, PROFILE_PALETTE.sable)),
        state: cityFresh ? t("new") : t("already"),
        fresh: cityFresh,
      },
      read.experiences.length > 0 && {
        key: "experiences" as const,
        title: t("experiences", { count: read.experiences.length }),
        chips: [...new Set(read.experiences.map((item) => item.company))]
          .slice(0, 4)
          .map((name) => chip(name)),
        state: state(freshExperiences, read.experiences.length, "one"),
        fresh: freshExperiences > 0,
      },
      read.educations.length > 0 && {
        key: "educations" as const,
        title: t("educations", { count: read.educations.length }),
        chips: read.educations.slice(0, 3).map((item) => chip(item.degree, PROFILE_PALETTE.lilas)),
        state: state(freshEducations, read.educations.length, "one"),
        fresh: freshEducations > 0,
      },
      read.skills.length > 0 && {
        key: "skills" as const,
        title: t("skills", { count: read.skills.length }),
        chips: read.skills.slice(0, 4).map((name) => chip(name)),
        state: state(freshSkills, read.skills.length, "many"),
        fresh: freshSkills > 0,
      },
      read.languages.length > 0 && {
        key: "languages" as const,
        title: t("languages", { count: read.languages.length }),
        chips: read.languages.slice(0, 4).map((code) => chip(label(code), PROFILE_PALETTE.menthe)),
        state: state(freshLanguages, read.languages.length, "many"),
        fresh: freshLanguages > 0,
      },
    ] as (Group | false)[]
  ).filter((group): group is Group => Boolean(group));
  const undated = read.experiences.filter((item) => !item.start).length;
  // With nothing read, the profile cannot be filled and the new CV starts from the profile.
  const ways = [
    { key: "keep", mark: "modele", action: keepImportedCvAction },
    ...(groups.length > 0
      ? ([
          { key: "profile", mark: "orbi", action: profileFromImportAction },
          { key: "newCv", mark: "nouveau", action: newCvFromImportAction },
        ] as const)
      : ([{ key: "fromProfile", mark: "nouveau", action: newCareerCvAction }] as const)),
  ] as const;

  return (
    <CvFrame
      title={t("title")}
      sub={tc("import.step", { step: 3 })}
      back={{ href: "/app/career/cv/nouveau?etape=import", label: tc("back") }}
    >
      <form id="cv-trouve" action={keepImportedCvAction}>
        <input type="hidden" name="import" value={importId} />
        <p className="nb-cv-aide">{groups.length > 0 ? t("hint") : t("nothing")}</p>
        <ul className="nb-cv-trouves">
          {groups.map((group, index) => (
            <li key={group.key} style={{ animationDelay: `${0.06 * index}s` }}>
              <label className="nb-cv-trouve">
                <input type="checkbox" name="groupe" value={group.key} defaultChecked />
                <span className="nb-cv-case" aria-hidden>
                  <PhoneIcon name="coche" size={16} stroke={2.6} />
                </span>
                <span className="nb-cv-trouve-t">
                  <b>{group.title}</b>
                  <span className="nb-cv-puces">
                    {group.chips.map((item) => (
                      <i key={item.text} style={{ "--c": item.color } as React.CSSProperties}>
                        {item.text}
                      </i>
                    ))}
                  </span>
                </span>
                <em data-nouveau={group.fresh ? "" : undefined}>{group.state}</em>
              </label>
            </li>
          ))}
        </ul>
        {undated > 0 ? <p className="nb-cv-note">{t("undated", { count: undated })}</p> : null}
        {read.source === "rules" ? <p className="nb-cv-note">{t("rulesOnly")}</p> : null}
        <h2 className="nb-cv-choix-t">{t("choose")}</h2>
        <ul className="nb-cv-departs" data-choix="">
          {ways.map((way, index) => (
            <li key={way.key} style={{ animationDelay: `${0.06 * index + 0.1}s` }}>
              <button
                type="submit"
                formAction={way.action}
                className="nb-cv-depart"
                data-cle={way.key}
              >
                <span className="nb-cv-depart-i" aria-hidden>
                  <CvMark name={way.mark} size={24} />
                </span>
                <span className="nb-cv-depart-t">
                  <b>{t(way.key)}</b>
                  <small>{t(`${way.key}Text`)}</small>
                </span>
                <PhoneIcon name="chevron" size={18} />
              </button>
            </li>
          ))}
        </ul>
        {groups.length > 0 ? <p className="nb-cv-note">{t("consent")}</p> : null}
      </form>
    </CvFrame>
  );
}
