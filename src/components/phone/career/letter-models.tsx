"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  letterColors,
  letterPhotos,
  letterTemplates,
  type LetterDesign,
  type LetterSheetData,
  type LetterTemplateId,
} from "@/features/letter/design";
import { LetterSheet } from "@/features/letter/LetterSheet";
import { PhoneIcon } from "../icon";

function Validate({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="nb-lt-bt" disabled={pending}>
      <PhoneIcon name="coche" size={20} stroke={2.4} />
      {label}
    </button>
  );
}

/**
 * « Le modèle visuel » of a letter (Ephraïm, 31/10/2026): the six templates drawn with the
 * person's own letter, the colour and the photo (round, square or none) changing them at once;
 * a template the plan does not include shows its padlock and the plan that opens it. « Valider
 * le modèle » keeps the choice and opens the preview.
 */
export function LetterModelPicker({
  documentId,
  data,
  initial,
  access,
  lockedPlan,
  hasPhoto,
  action,
  error,
}: {
  documentId: string;
  data: LetterSheetData;
  initial: Pick<LetterDesign, "template" | "color" | "photo">;
  access: Record<LetterTemplateId, boolean>;
  /** The cheapest plan that opens the other templates (read from the base). */
  lockedPlan: string;
  hasPhoto: boolean;
  action: (formData: FormData) => Promise<void>;
  error: string | null;
}) {
  const t = useTranslations("letterModel");
  const [template, setTemplate] = useState<LetterTemplateId>(
    access[initial.template] ? initial.template : "horizon",
  );
  const [color, setColor] = useState(initial.color);
  const [photo, setPhoto] = useState(initial.photo);
  const [locked, setLocked] = useState<LetterTemplateId | null>(null);
  const design = { template, color, photo };

  return (
    <form action={action} className="lm-choix">
      <input type="hidden" name="id" value={documentId} />
      <input type="hidden" name="template" value={template} />

      {error ? (
        <p className="nb-lt-note" role="alert">
          {error}
        </p>
      ) : null}

      <fieldset className="lm-groupe">
        <legend>{t("pick.color")}</legend>
        <div className="lm-teintes">
          {letterColors.map((item) => (
            <label key={item.code} className="lm-teinte" style={{ background: item.hex }}>
              <input
                type="radio"
                name="color"
                value={item.code}
                checked={color === item.code}
                onChange={() => setColor(item.code)}
                aria-label={t(`color.${item.code}`)}
              />
              <PhoneIcon name="coche" size={16} stroke={3} />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="lm-groupe">
        <legend>{t("pick.photo")}</legend>
        <div className="lm-puces">
          {letterPhotos.map((item) => (
            <label key={item} className="lm-puce">
              <input
                type="radio"
                name="photo"
                value={item}
                checked={photo === item}
                onChange={() => setPhoto(item)}
              />
              <span className="lm-forme" data-forme={item} aria-hidden />
              {t(`photo.${item}`)}
            </label>
          ))}
        </div>
        {!hasPhoto && photo !== "aucune" ? (
          <p className="nb-lt-note">
            {t("pick.noPhoto")}{" "}
            <Link href="/app/profil" className="lm-lien">
              {t("pick.addPhoto")}
            </Link>
          </p>
        ) : null}
      </fieldset>

      <fieldset className="lm-groupe">
        <legend>{t("pick.templates", { count: letterTemplates.length })}</legend>
        <ul className="lm-grille">
          {letterTemplates.map((item) => {
            const open = access[item.id];
            const selected = template === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="lm-modele"
                  aria-pressed={selected}
                  data-ferme={open ? undefined : ""}
                  onClick={() => {
                    if (open) {
                      setTemplate(item.id);
                      setLocked(null);
                    } else setLocked(item.id);
                  }}
                >
                  <LetterSheet data={data} design={{ ...design, template: item.id }} thumbnail />
                  <span className="lm-modele-nom">
                    {selected ? <PhoneIcon name="coche" size={15} stroke={3} /> : null}
                    {t(`template.${item.id}`)}
                  </span>
                  {open ? null : (
                    <span className="lm-cadenas">
                      <PhoneIcon name="cadenas" size={14} />
                      {lockedPlan ? t("pick.locked", { plan: lockedPlan }) : t("pick.lockedPaid")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {locked ? (
          <p className="lm-ferme-note" role="status">
            <PhoneIcon name="cadenas" size={18} />
            <span>
              {lockedPlan
                ? t("pick.lockedNote", { name: t(`template.${locked}`), plan: lockedPlan })
                : t("pick.lockedNotePaid", { name: t(`template.${locked}`) })}{" "}
              <Link href="/app/abonnement" className="lm-lien">
                {t("pick.upgrade")}
              </Link>
            </span>
          </p>
        ) : null}
      </fieldset>

      <div className="lm-bas">
        <Validate label={t("pick.validate")} />
      </div>
    </form>
  );
}
