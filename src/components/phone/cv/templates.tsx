"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { showToast } from "@/components/motion/toaster";
import { PhoneIcon } from "../icon";
import type { TemplateChoice, TemplateLevel } from "./data";
import { CvFrame } from "./frame";

function Submit({ label, form }: { label: string; form: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      form={form}
      className="nb-bouton nb-cv-principal"
      data-plein=""
      data-large=""
      disabled={pending}
    >
      {label}
    </button>
  );
}

/**
 * « Choisir un modèle » and « Voir en grand » (captures 07, 08): the fifteen real templates,
 * filtered by level; a touch chooses, a second touch shows the template large. A template the
 * person's plan does not include says which plan does.
 */
export function CvTemplatePicker({
  choices,
  filters,
  sub,
  initial,
  action,
  cvId,
  back,
  steps,
  error,
}: {
  choices: TemplateChoice[];
  filters: { key: "tous" | TemplateLevel; label: string }[];
  sub: string;
  initial: string;
  action: (formData: FormData) => Promise<void>;
  cvId: string | null;
  back: string;
  steps: ComponentProps<typeof CvFrame>["steps"];
  error: string | null;
}) {
  const t = useTranslations("phoneCv");
  const [filter, setFilter] = useState<"tous" | TemplateLevel>("tous");
  const [chosen, setChosen] = useState(initial);
  const [large, setLarge] = useState(false);
  const formId = cvId ? `cv-modele-${cvId}` : "cv-modele-nouveau";
  const current = choices.find((choice) => choice.id === chosen) ?? choices[0]!;
  const shown = choices.filter((choice) => filter === "tous" || choice.level === filter);
  const form = (
    <form id={formId} action={action} hidden>
      <input type="hidden" name="template" value={current.id} />
      {cvId ? <input type="hidden" name="id" value={cvId} /> : null}
    </form>
  );

  if (large)
    return (
      <CvFrame
        title={t("template.largeTitle", { name: current.name })}
        sub={t("template.largeSub")}
        back={{ href: back, label: t("back"), onClick: () => setLarge(false) }}
        bottom={
          current.lockedBy ? (
            <Link
              href="/app/abonnement"
              className="nb-bouton nb-cv-principal"
              data-plein=""
              data-large=""
            >
              {t("template.unlock", { plan: current.lockedBy })}
            </Link>
          ) : (
            <Submit label={t("template.use")} form={formId} />
          )
        }
      >
        {form}
        <div className="nb-cv-grand">
          <Image
            src={current.image}
            alt={t("template.largeAlt", { name: current.name })}
            width={600}
            height={848}
            sizes="(max-width: 480px) 100vw, 440px"
            priority
          />
        </div>
        <ul className="nb-cv-tags">
          {current.tags.map((tag, index) => (
            <li key={tag} data-premier={index === 0 ? "" : undefined}>
              {tag}
            </li>
          ))}
        </ul>
        <p className="nb-cv-note">{t("template.largeNote")}</p>
      </CvFrame>
    );

  return (
    <CvFrame
      title={t("template.title")}
      sub={sub}
      back={{ href: back, label: t("back") }}
      steps={steps}
      bottom={
        current.lockedBy ? (
          <Link
            href="/app/abonnement"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
          >
            {t("template.unlock", { plan: current.lockedBy })}
          </Link>
        ) : (
          <Submit label={cvId ? t("template.apply") : t("continue")} form={formId} />
        )
      }
    >
      {form}
      {error ? (
        <p className="nb-cv-erreur" role="alert">
          {error}
        </p>
      ) : null}
      <div className="nb-cv-filtres" role="group" aria-label={t("template.filters")}>
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            className="nb-cv-filtre"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="nb-cv-aide">{t("template.hint")}</p>
      <ul className="nb-cv-modeles">
        {shown.map((choice, index) => {
          const selected = choice.id === current.id;
          return (
            <li key={choice.id} style={{ animationDelay: `${0.03 * index}s` }}>
              <button
                type="button"
                className="nb-cv-modele"
                aria-pressed={selected}
                data-verrou={choice.lockedBy ? "" : undefined}
                aria-label={
                  choice.lockedBy
                    ? t("template.lockedLabel", { name: choice.name, plan: choice.lockedBy })
                    : selected
                      ? t("template.selectedLabel", { name: choice.name })
                      : choice.name
                }
                onClick={() => {
                  if (choice.lockedBy && !selected) {
                    setChosen(choice.id);
                    showToast({ message: t("template.locked", { plan: choice.lockedBy }) });
                    return;
                  }
                  if (selected) setLarge(true);
                  else setChosen(choice.id);
                }}
              >
                <span className="nb-cv-modele-img">
                  <Image src={choice.image} alt="" width={300} height={424} sizes="45vw" />
                  {selected ? (
                    <i className="nb-cv-coche" aria-hidden>
                      <PhoneIcon name="coche" size={18} stroke={2.6} />
                    </i>
                  ) : null}
                  {choice.lockedBy ? (
                    <em className="nb-cv-verrou">
                      <PhoneIcon name="cadenas" size={13} stroke={2.2} />
                      {t("template.with", { plan: choice.lockedBy })}
                    </em>
                  ) : null}
                </span>
                <span className="nb-cv-modele-t">
                  <b>{choice.name}</b>
                  <small data-niveau={choice.level}>{choice.levelLabel}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </CvFrame>
  );
}
