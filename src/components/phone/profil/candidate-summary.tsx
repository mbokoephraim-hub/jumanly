"use client";

import "@/styles/phone-apropos.css";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { GoldSeal } from "../badge-or";
import { FilAvatar } from "../fil/avatar";
import type { ProfileView } from "./data";
import { EducationList, ItemVerifiedMark } from "./education-rows";
import { ExperienceLogo, ExperienceMeta, ExperiencePoints } from "./experience-head";
import { AboutCard, ringOf, SOCIAL_PATHS } from "./profile";

/** Réalisations clés shown before « Voir plus », as on the profile. */
const POINTS_SHOWN = 4;
const tint = (color: string, alpha: string) => `${color}${alpha}`;

/**
 * The head of a candidate's file on the recruiter's phone (Ephraïm, 03/11/2026): the photo in its
 * ring and, on the same line, the name, the title, the place, the e-mail and LinkedIn. Nothing
 * else (no badge, followers, company, handle or common connections).
 */
export function CandidateHead({
  person,
  name,
  title,
  email,
  masked,
}: {
  person: ProfileView;
  /** « Candidat 3 » when sorted blind. */
  name: string;
  title: string | null;
  email: string | null;
  /** Sorted blind and not retained yet: no photo, no contacts. */
  masked: boolean;
}) {
  const t = useTranslations("phoneProfile");
  const linkedin = person.socials.find((item) => item.kind === "linkedin");
  const icon = (d: string) => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
  return (
    <section className="nb-pf nb-rh-fp-tete" aria-labelledby="rh-fr-nom">
      <span className="nb-pf-photo" style={{ background: ringOf(person.ring) }}>
        {person.image && !masked ? (
          // eslint-disable-next-line @next/next/no-img-element -- the person's own photo
          <img src={person.image} alt="" />
        ) : (
          <span className="nb-pf-photo-i" aria-hidden>
            <FilAvatar
              initials={masked ? "" : person.initials}
              image={null}
              tone={person.tone}
              org={false}
              size={80}
            />
          </span>
        )}
      </span>
      <div className="nb-rh-fp-qui">
        <h1 id="rh-fr-nom">{name}</h1>
        {title ? <p className="nb-rh-fp-titre">{title}</p> : null}
        <ul className="nb-rh-fp-contacts" aria-label={t("socials")}>
          {person.place ? (
            <li>
              {person.place.flag ? (
                <span role="img" aria-label={person.place.flagLabel}>
                  {person.place.flag}
                </span>
              ) : null}
              <span>{person.place.text}</span>
            </li>
          ) : null}
          {!masked && email ? (
            <li>
              {icon(SOCIAL_PATHS.email)}
              <a href={`mailto:${email}`}>{email}</a>
            </li>
          ) : null}
          {!masked && linkedin ? (
            <li>
              {icon(SOCIAL_PATHS.linkedin)}
              <a href={linkedin.href} target="_blank" rel="noopener noreferrer nofollow">
                {linkedin.label}
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

/**
 * « Résumé » of a candidate (Ephraïm, 03/11/2026): the same pieces as « À propos » of the profile,
 * in the same sizes: the bio (the one of the CV sent, else the profile's), the skills with their
 * families, every experience, the diplomas, the certificates and the languages.
 */
export function CandidateAbout({
  person,
  bio,
}: {
  person: ProfileView;
  bio: { title: string | null; text: string } | null;
}) {
  const t = useTranslations("phoneProfile");
  const [unfolded, setUnfolded] = useState<string[]>(person.experiences.map((e) => e.id));
  const educationLabels = {
    verified: t("itemVerified"),
    verifiedHelp: t("verifiedHelp"),
    document: t("documentJoined"),
    jumanly: t("jumanly"),
    openImage: (title: string) => t("openImage", { title }),
  };
  return (
    <div className="nb-pf nb-pf-pane nb-rh-fp-apropos">
      {bio ? <AboutCard about={bio} /> : null}

      <h2 className="nb-pf-h" data-loin="">
        {t("skills")} <span>{person.skillsCount}</span>
      </h2>
      {person.skills.length === 0 ? (
        <p className="nb-pf-vide">{t("noSkills", { name: person.first })}</p>
      ) : (
        <>
          <div className="nb-pf-barre-f" aria-hidden>
            {person.families.map((family, at) => (
              <span
                key={family.label}
                style={{
                  flex: family.share,
                  background: family.color,
                  animationDelay: `${at * 0.1}s`,
                }}
              />
            ))}
          </div>
          <ul className="nb-pf-legende">
            {person.families.map((family) => (
              <li key={family.label}>
                <i style={{ background: family.color }} aria-hidden />
                {family.label}
              </li>
            ))}
          </ul>
          <ul className="nb-pf-comp">
            {person.skills.map((skill, at) => (
              <li
                key={skill.name}
                className="nb-pf-sk"
                style={{
                  background: tint(skill.color, "1F"),
                  borderColor: tint(skill.color, "55"),
                  color: skill.color,
                  animationDelay: `${at * 0.05}s`,
                }}
              >
                <i style={{ background: skill.color }} aria-hidden />
                {skill.name}
                {skill.verified ? <GoldSeal size={15} label={t("skillVerified")} /> : null}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="nb-pf-h" data-loin="">
        <span className="nb-pf-h-t">
          {t("experiences")} <span>{person.experiencesCount}</span>
        </span>
      </h2>
      {person.experiences.length === 0 ? (
        <p className="nb-pf-vide">{t("noExperience")}</p>
      ) : (
        person.experiences.map((item, at) => {
          const all = unfolded.includes(item.id);
          const points = all ? item.points : item.points.slice(0, POINTS_SHOWN);
          return (
            <div key={item.id} className="nb-pf-xp">
              {at < person.experiences.length - 1 ? (
                <span
                  className="nb-pf-fil"
                  style={{ background: `linear-gradient(${item.color}, rgba(255,255,255,.08))` }}
                  aria-hidden
                />
              ) : null}
              <ExperienceLogo item={item} />
              <div>
                <h3>
                  {item.title}
                  {item.verified ? (
                    <ItemVerifiedMark label={t("itemVerified")} help={t("verifiedHelp")} />
                  ) : null}
                </h3>
                <ExperienceMeta item={item} label={t("companyPage", { company: item.company })} />
                <ExperiencePoints item={item} points={points} />
                {item.points.length > POINTS_SHOWN ? (
                  <button
                    type="button"
                    className="nb-pf-plus"
                    style={{ color: item.color }}
                    aria-expanded={all}
                    onClick={() =>
                      setUnfolded((current) =>
                        all ? current.filter((id) => id !== item.id) : [...current, item.id],
                      )
                    }
                  >
                    {all ? t("less") : t("moreLines", { count: item.points.length - POINTS_SHOWN })}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}

      {person.diplomas.length > 0 ? (
        <>
          <h2 className="nb-pf-h">{t("diplomas")}</h2>
          <EducationList rows={person.diplomas} labels={educationLabels} />
        </>
      ) : null}

      {person.certificates.length > 0 ? (
        <>
          <h2 className="nb-pf-h">{t("certificates")}</h2>
          <EducationList rows={person.certificates} labels={educationLabels} />
        </>
      ) : null}

      {person.languages.length > 0 ? (
        <>
          <h2 className="nb-pf-h" data-loin="">
            {t("languages")}
          </h2>
          <ul className="nb-pf-langues">
            {person.languages.map((item) => (
              <li key={item.name}>
                <b>
                  {item.flag ? (
                    <span className="nb-pf-drapeau" aria-hidden>
                      {item.flag}
                    </span>
                  ) : null}
                  {item.name}
                </b>
                <span
                  className="nb-pf-niv"
                  role="img"
                  aria-label={t("level", { level: item.level })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i key={n} data-on={n <= item.level ? "" : undefined} />
                  ))}
                </span>
                <small>{item.label}</small>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
