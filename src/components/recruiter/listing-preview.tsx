"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { TalentIcon } from "@/components/talent/icon";
import { initials } from "@/components/ui/avatar";

export type ListingFacts = {
  title: string;
  city: string;
  contractType: string;
  remote: string;
  responsibilities: string[];
  required: string[];
  preferred: string[];
  /** `YYYY-MM-DD`, or empty. */
  closesAt: string;
  documents: string[];
};

const lines = (value: FormDataEntryValue | null) =>
  typeof value === "string"
    ? value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : null;
const list = (value: FormDataEntryValue | null) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : null;
const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : null);

/** What the form says now, over what was saved (a field of another step keeps its saved value). */
function read(form: HTMLFormElement, saved: ListingFacts): ListingFacts {
  const data = new FormData(form);
  const has = (name: string) => form.querySelector(`[name="${name}"]`) !== null;
  return {
    title: (has("title") ? text(data.get("title"))?.trim() : null) || saved.title,
    city: (has("city") ? text(data.get("city"))?.trim() : null) || saved.city,
    contractType: text(data.get("contractType")) ?? saved.contractType,
    remote: text(data.get("remote")) ?? saved.remote,
    responsibilities: lines(data.get("responsibilities")) ?? saved.responsibilities,
    required: list(data.get("requiredSkills")) ?? saved.required,
    preferred: list(data.get("preferredSkills")) ?? saved.preferred,
    closesAt: has("closesAt") ? (text(data.get("closesAt")) ?? "") : saved.closesAt,
    documents: has("documents")
      ? data.getAll("documents").filter((item): item is string => typeof item === "string")
      : saved.documents,
  };
}

/**
 * « Aperçu de l'annonce » of the offer's steps on a computer (planche web recruteur-1 § 3 `.ap-l`):
 * the card the talents will see, updated at each keystroke from the form of the step (nothing is
 * saved here; « Continuer » saves). Empty parts stay as grey lines.
 */
export function ListingPreview({
  formId,
  saved,
  org,
  labels,
}: {
  formId: string;
  saved: ListingFacts;
  org: { name: string; banner: string | null; logo: string | null };
  labels: {
    title: string;
    free: string;
    contract: Record<string, string>;
    remote: Record<string, string>;
    documents: Record<string, string>;
    /** « {skill} · souhaité ». */
    preferred: string;
    /** « Limite {date} ». */
    deadline: string;
    noDeadline: string;
  };
}) {
  const locale = useLocale();
  const [facts, setFacts] = useState(saved);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    let frame = 0;
    // Editors keep their values in hidden fields, set after the click: read on the next frame.
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setFacts(read(form, saved)));
    };
    update();
    for (const type of ["input", "change", "click", "keyup"]) form.addEventListener(type, update);
    return () => {
      cancelAnimationFrame(frame);
      for (const type of ["input", "change", "click", "keyup"])
        form.removeEventListener(type, update);
    };
  }, [formId, saved]);

  const place = [
    org.name,
    facts.city,
    labels.contract[facts.contractType],
    labels.remote[facts.remote],
  ]
    .filter(Boolean)
    .join(" · ");
  const date = facts.closesAt
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(
        new Date(`${facts.closesAt}T00:00:00Z`),
      )
    : null;
  const end = [
    date ? labels.deadline.replace("{date}", date) : labels.noDeadline,
    facts.documents.map((kind) => labels.documents[kind] ?? kind).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <section aria-labelledby={`${formId}-ap`} className="t-verre t-rw-ap">
        <h2 id={`${formId}-ap`} className="t-k">
          {labels.title}
        </h2>
        <div className="t-ban" aria-hidden>
          {org.banner && (
            // eslint-disable-next-line @next/next/no-img-element -- the organization's banner, already sized
            <img src={org.banner} alt="" />
          )}
          <span className="t-lg-e t-sap">
            {org.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- a 48 px logo
              <img src={org.logo} alt="" />
            ) : (
              initials(org.name)
            )}
          </span>
        </div>
        <div className="t-c">
          {facts.title ? (
            <b>{facts.title}</b>
          ) : (
            <i className="t-vide-l" style={{ width: "60%" }} aria-hidden />
          )}
          <span>{place}</span>
          {facts.responsibilities.length > 0 ? (
            <ul>
              {facts.responsibilities.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <>
              <i className="t-vide-l" aria-hidden />
              <i className="t-vide-l" style={{ width: "70%" }} aria-hidden />
            </>
          )}
          {facts.required.length + facts.preferred.length > 0 ? (
            <div className="t-tags">
              {facts.required.map((skill) => (
                <span key={skill} className="t-tag">
                  {skill}
                </span>
              ))}
              {facts.preferred.map((skill) => (
                <span key={skill} className="t-tag">
                  {labels.preferred.replace("{skill}", skill)}
                </span>
              ))}
            </div>
          ) : (
            <i className="t-vide-l" style={{ width: "50%" }} aria-hidden />
          )}
          <span>{end}</span>
        </div>
      </section>
      <p className="t-gar">
        <TalentIcon name="valider" size="s" />
        <span>{labels.free}</span>
      </p>
    </>
  );
}
