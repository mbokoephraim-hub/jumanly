"use client";

import "@/styles/phone-verification.css";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  cancelReferenceCheckAction,
  uploadEducationImageAction,
} from "@/server/actions/career-phone";
import { PhoneIcon } from "../icon";

/** The referent typed in the form; empty fields mean « no request ». */
export type ReferentValue = { name: string; email: string; role: string };
export const NO_REFERENT: ReferentValue = { name: "", email: "", role: "" };

/** The last request of the item, as the page read it. */
export type ReferenceStateValue = {
  id: string;
  status: "pending" | "confirmed" | "declined";
  referentName: string;
  at: string;
} | null;

/**
 * « Faire vérifier » (demande d'Ephraïm du 29/10/2026): always proposed, never required. With no
 * request running, « Ajouter un référent » opens the name, the e-mail and the link with the
 * person; the e-mail leaves once the item is saved. A running or confirmed request shows its
 * state and can be withdrawn.
 */
export function ReferentField({
  state,
  value,
  onChange,
  intro,
  errors,
}: {
  state: ReferenceStateValue;
  value: ReferentValue;
  onChange: (value: ReferentValue) => void;
  /** Why it matters, for an experience or a certificate. */
  intro: string;
  errors: { name?: string | null; email?: string | null };
}) {
  const t = useTranslations("phoneCareer.form.reference");
  const id = useId();
  const [current, setCurrent] = useState(state);
  const [open, setOpen] = useState(Boolean(value.name || value.email));
  const [pending, start] = useTransition();
  const withdraw = (checkId: string) =>
    start(async () => {
      const result = await cancelReferenceCheckAction(checkId).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      setCurrent(null);
    });

  if (current && current.status !== "declined")
    return (
      <div className="nb-ca-ch">
        <div className="nb-vf-bloc" data-etat={current.status}>
          <span className="nb-vf-rond" aria-hidden>
            <PhoneIcon name={current.status === "confirmed" ? "coche" : "horloge"} size={18} />
          </span>
          <div>
            <strong>
              {current.status === "confirmed"
                ? t("confirmed", { name: current.referentName })
                : t("pending", { name: current.referentName })}
            </strong>
            <span>
              {current.status === "confirmed"
                ? t("confirmedText", { date: current.at })
                : t("pendingText", { date: current.at })}
            </span>
            <div>
              <button type="button" onClick={() => withdraw(current.id)} disabled={pending}>
                {current.status === "confirmed" ? t("removeVerified") : t("removePending")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="nb-ca-ch">
      <div className="nb-vf-bloc">
        <span className="nb-vf-rond" aria-hidden>
          <PhoneIcon name="coche" size={18} />
        </span>
        <div>
          <strong>
            {t("title")} <em>{t("recommended")}</em>
          </strong>
          <span>{intro}</span>
          {current?.status === "declined" ? (
            <span className="nb-vf-non">{t("declined", { name: current.referentName })}</span>
          ) : null}
          {open ? null : (
            <div>
              <button type="button" data-plein="" onClick={() => setOpen(true)}>
                <PhoneIcon name="plus" size={15} />
                {t("add")}
              </button>
            </div>
          )}
        </div>
      </div>
      {open ? (
        <div className="nb-vf-champs">
          <label htmlFor={`${id}-nom`}>{t("name")}</label>
          <input
            id={`${id}-nom`}
            className="nb-ca-in"
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            placeholder={t("namePlaceholder")}
            maxLength={120}
            autoComplete="off"
          />
          {errors.name ? (
            <p className="nb-ca-erreur" role="alert">
              {errors.name}
            </p>
          ) : null}
          <label htmlFor={`${id}-mail`}>{t("email")}</label>
          <input
            id={`${id}-mail`}
            className="nb-ca-in"
            type="email"
            inputMode="email"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
            placeholder={t("emailPlaceholder")}
            maxLength={200}
            autoComplete="off"
          />
          {errors.email ? (
            <p className="nb-ca-erreur" role="alert">
              {errors.email}
            </p>
          ) : null}
          <label htmlFor={`${id}-role`}>{t("role")}</label>
          <input
            id={`${id}-role`}
            className="nb-ca-in"
            value={value.role}
            onChange={(event) => onChange({ ...value, role: event.target.value })}
            placeholder={t("rolePlaceholder")}
            maxLength={120}
          />
          <p className="nb-vf-aide">{t("how")}</p>
          <button
            type="button"
            className="nb-vf-annuler"
            onClick={() => {
              onChange({ name: "", email: "", role: "" });
              setOpen(false);
            }}
          >
            {t("later")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * « Photo du certificat » / « Photo du diplôme »: the person joins a picture of the document,
 * shown on the profile and opened full size by a tap.
 */
export function DocumentImageField({
  label,
  hint,
  image,
  onChange,
}: {
  label: string;
  hint: string;
  image: string | null;
  onChange: (image: string | null) => void;
}) {
  const t = useTranslations("phoneCareer.form");
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const send = (file: File) =>
    start(async () => {
      const form = new FormData();
      form.set("image", file);
      const result = await uploadEducationImageAction(form).catch(() => null);
      if (result?.ok) onChange(result.image);
      else
        showToast({
          message: t.has(`errors.${result?.error}` as "errors.imageType")
            ? t(`errors.${result?.error}` as "errors.imageType")
            : t("error"),
          tone: "error",
        });
    });
  return (
    <div className="nb-ca-ch">
      <div className="nb-vf-photo">
        <span className="nb-vf-vignette" aria-hidden>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- the person's own photo
            <img src={image} alt="" width={64} height={64} />
          ) : (
            <PhoneIcon name="photo" size={22} />
          )}
        </span>
        <div>
          <strong>{label}</strong>
          <span>{hint}</span>
          <div>
            <button
              type="button"
              data-plein=""
              onClick={() => input.current?.click()}
              disabled={pending}
              aria-busy={pending}
            >
              <PhoneIcon name="photo" size={15} />
              {pending ? t("logoSending") : image ? t("imageChange") : t("imageAdd")}
            </button>
            {image ? (
              <button type="button" onClick={() => onChange(null)} disabled={pending}>
                {t("logoRemove")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) send(file);
        }}
      />
    </div>
  );
}
