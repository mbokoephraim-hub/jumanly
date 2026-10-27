"use client";

/* eslint-disable @next/next/no-img-element -- the banner and the logo, already reduced */
import "@/styles/phone-entreprise.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import type { SocialLinks } from "@/lib/social-links";
import { showToast } from "@/components/motion/toaster";
import { removeBrandImageAction, uploadBrandImageAction } from "@/server/actions/organization";
import { updateCompanyPageAction } from "@/server/actions/org-page";
import { PhoneBack } from "../back";
import { Field } from "../career/edit";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { initialsOf } from "./compte-initials";

export type PhoneCompanyProfileData = {
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  sector: string;
  size: string;
  city: string;
  website: string;
  description: string;
  hiringNow: boolean;
  verified: boolean;
  sizes: { value: string; label: string }[];
  /** ISO code of the seat's country. */
  country: string;
  countries: { value: string; label: string }[];
  foundedYear: string;
  international: boolean;
  socialLinks: SocialLinks;
};

const NETWORKS = ["linkedin", "instagram", "facebook", "x"] as const;

type Kind = "banner" | "logo";

/**
 * The company's profile on the recruiter's phone (Ephraïm, 27/10/2026): the banner and the logo
 * (changed or removed at once, cropped from the center by the server), then the name, the sector,
 * the size, the city, the site, « À propos » and the « Recrute en ce moment » badge, published
 * with « Enregistrer ». The same rules as Page entreprise on a computer.
 */
export function PhoneCompanyProfile({ data }: { data: PhoneCompanyProfileData }) {
  const t = useTranslations("phoneRhEntreprise");
  const to = useTranslations("orgPage");
  const router = useRouter();
  const [form, setForm] = useState({
    name: data.name,
    sector: data.sector,
    size: data.size,
    city: data.city,
    website: data.website,
    description: data.description,
    hiringNow: data.hiringNow,
    country: data.country,
    foundedYear: data.foundedYear,
    international: data.international,
    socialLinks: {
      linkedin: data.socialLinks.linkedin ?? "",
      instagram: data.socialLinks.instagram ?? "",
      facebook: data.socialLinks.facebook ?? "",
      x: data.socialLinks.x ?? "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Kind | null>(null);
  const [pending, start] = useTransition();
  const [sending, startImage] = useTransition();
  const picker = useRef<HTMLInputElement>(null);
  const picking = useRef<Kind>("logo");
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const save = () =>
    start(async () => {
      const result = await updateCompanyPageAction(form);
      setError(result.ok ? null : (result.field ?? "other"));
      showToast(result.ok ? { message: result.text } : { message: result.text, tone: "error" });
      if (result.ok) router.push("/app/hire/entreprise");
    });

  const choose = (kind: Kind) => {
    setSheet(null);
    picking.current = kind;
    picker.current?.click();
  };
  const send = (file: File | undefined) => {
    if (!file) return;
    const body = new FormData();
    body.set("kind", picking.current);
    body.set("image", file);
    startImage(async () => {
      const result = await uploadBrandImageAction(body);
      if (picker.current) picker.current.value = "";
      if (!result.ok) {
        showToast({ message: t(`imageError.${result.code}`), tone: "error" });
        return;
      }
      showToast({ message: t(picking.current === "logo" ? "logoSaved" : "bannerSaved") });
      router.refresh();
    });
  };
  const remove = (kind: Kind) => {
    setSheet(null);
    const body = new FormData();
    body.set("kind", kind);
    startImage(async () => {
      const result = await removeBrandImageAction(body);
      if (!result.ok) {
        showToast({ message: to("error.generic"), tone: "error" });
        return;
      }
      showToast({ message: t("imageRemoved") });
      router.refresh();
    });
  };

  return (
    <div className="nb-page nb-ca-form nb-ep">
      <header className="nb-ca-form-barre">
        <PhoneBack fallback="/app/hire/entreprise" label={t("cancel")} text={t("cancel")} />
        <h1>{t("title")}</h1>
        <button type="button" className="nb-ca-ok" onClick={save} disabled={pending}>
          {t("save")}
        </button>
      </header>

      <div className="nb-ep-visuel" aria-busy={sending}>
        <button
          type="button"
          className="nb-ep-banniere"
          onClick={() => (data.banner ? setSheet("banner") : choose("banner"))}
          aria-label={to("banner.change")}
        >
          {data.banner ? <img src={data.banner} alt="" /> : null}
          <span className="nb-ep-crayon">
            <PhoneIcon name="photo" size={18} />
          </span>
        </button>
        <button
          type="button"
          className="nb-ep-logo"
          onClick={() => (data.logo ? setSheet("logo") : choose("logo"))}
          aria-label={to("logo.change")}
        >
          {data.logo ? <img src={data.logo} alt="" /> : <span>{initialsOf(form.name)}</span>}
          <span className="nb-ep-crayon">
            <PhoneIcon name="photo" size={15} />
          </span>
        </button>
      </div>
      <p className="nb-meta nb-ep-aide">{t("imagesHint")}</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        aria-label={to("form.aria")}
      >
        <Field label={to("field.name")} error={error === "name" ? to("error.name") : null}>
          {(id) => (
            <input
              id={id}
              className="nb-ca-in"
              value={form.name}
              onChange={(event) => set({ name: event.target.value })}
              maxLength={120}
              required
            />
          )}
        </Field>
        <Field label={to("field.sector")}>
          {(id) => (
            <input
              id={id}
              className="nb-ca-in"
              value={form.sector}
              onChange={(event) => set({ sector: event.target.value })}
              placeholder={t("sectorPlaceholder")}
              maxLength={120}
            />
          )}
        </Field>
        <p className="nb-meta nb-ep-aide nb-ep-aide-champ">{t("sectorHint")}</p>
        <div className="nb-ca-deux">
          <Field label={to("field.size")}>
            {(id) => (
              <select
                id={id}
                className="nb-ca-in"
                value={form.size}
                onChange={(event) => set({ size: event.target.value })}
              >
                <option value="">{to("field.sizeNone")}</option>
                {data.sizes.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            label={t("foundedYear")}
            error={error === "foundedYear" ? to("error.foundedYear") : null}
          >
            {(id) => (
              <input
                id={id}
                className="nb-ca-in"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={form.foundedYear}
                onChange={(event) =>
                  set({ foundedYear: event.target.value.replace(/\D/g, "").slice(0, 4) })
                }
                placeholder={t("foundedPlaceholder")}
              />
            )}
          </Field>
        </div>
        <div className="nb-ca-bascule">
          <span id="ep-international">
            {t("international.label")}
            <small className="nb-meta">{t("international.hint")}</small>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.international}
            aria-labelledby="ep-international"
            className="nb-switch"
            onClick={() => set({ international: !form.international })}
          >
            <span />
          </button>
        </div>
        <div className="nb-ca-deux">
          <Field label={t("country")}>
            {(id) => (
              <select
                id={id}
                className="nb-ca-in"
                value={form.country}
                onChange={(event) => set({ country: event.target.value })}
              >
                <option value="">{t("countryNone")}</option>
                {data.countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("cityLabel")}>
            {(id) => (
              <input
                id={id}
                className="nb-ca-in"
                value={form.city}
                onChange={(event) => set({ city: event.target.value })}
                autoComplete="address-level2"
                maxLength={120}
              />
            )}
          </Field>
        </div>
        <Field label={to("field.website")} error={error === "website" ? to("error.website") : null}>
          {(id) => (
            <input
              id={id}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              className="nb-ca-in"
              value={form.website}
              onChange={(event) => set({ website: event.target.value })}
              placeholder={t("websitePlaceholder")}
              maxLength={200}
            />
          )}
        </Field>
        <Field label={to("field.description")}>
          {(id) => (
            <>
              <textarea
                id={id}
                className="nb-ca-in nb-ep-texte"
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
                placeholder={to("field.descriptionPlaceholder")}
                maxLength={3000}
                rows={7}
              />
              <small className="nb-meta nb-ep-compte" aria-hidden>
                {t("counter", { count: form.description.length })}
              </small>
            </>
          )}
        </Field>
        <h2 className="nb-ep-titre">{t("socials")}</h2>
        <p className="nb-meta nb-ep-aide nb-ep-aide-champ">{t("socialsHint")}</p>
        {NETWORKS.map((kind) => (
          <Field key={kind} label={t(`social.${kind}`)}>
            {(id) => (
              <input
                id={id}
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                className="nb-ca-in"
                value={form.socialLinks[kind]}
                onChange={(event) =>
                  set({ socialLinks: { ...form.socialLinks, [kind]: event.target.value } })
                }
                placeholder={t(`socialPlaceholder.${kind}`)}
                maxLength={300}
              />
            )}
          </Field>
        ))}
        {error === "socialLinks" ? (
          <p className="nb-ca-erreur" role="alert">
            {to("error.socialLinks")}
          </p>
        ) : null}
        <div className="nb-ca-bascule">
          <span id="ep-recrute">
            {to("hiring.label")}
            <small className="nb-meta">{to("hiring.hint")}</small>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.hiringNow}
            aria-labelledby="ep-recrute"
            className="nb-switch"
            onClick={() => set({ hiringNow: !form.hiringNow })}
          >
            <span />
          </button>
        </div>
        {error === "other" ? (
          <p className="nb-ca-erreur" role="alert">
            {to("error.other")}
          </p>
        ) : null}
        <div className="nb-ep-pied">
          <button
            type="submit"
            className="nb-bouton"
            data-large=""
            data-plein=""
            disabled={pending}
          >
            {t("save")}
          </button>
          <Link
            href={`/app/entreprises/${data.slug}`}
            className="nb-bouton"
            data-large=""
            data-contour=""
          >
            {to("preview")}
          </Link>
        </div>
      </form>

      <input
        ref={picker}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => send(event.target.files?.[0])}
      />
      <PhoneSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        label={sheet === "banner" ? t("bannerSheet") : t("logoSheet")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{sheet === "banner" ? t("bannerSheet") : t("logoSheet")}</b>
        <button type="button" className="nb-opt nb-fil-opt" onClick={() => choose(sheet ?? "logo")}>
          <PhoneIcon name="photo" size={22} />
          <span>{sheet === "banner" ? to("banner.change") : to("logo.change")}</span>
        </button>
        <button
          type="button"
          className="nb-opt nb-fil-opt"
          data-alerte=""
          onClick={() => remove(sheet ?? "logo")}
        >
          <PhoneIcon name="corbeille" size={22} />
          <span>{sheet === "banner" ? t("removeBanner") : t("removeLogo")}</span>
        </button>
        <button type="button" className="nb-annuler" onClick={() => setSheet(null)}>
          {t("cancel")}
        </button>
      </PhoneSheet>
    </div>
  );
}
