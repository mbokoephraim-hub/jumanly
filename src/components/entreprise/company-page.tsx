"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { bannerBackground } from "@/lib/entreprise";
import { removeBrandImageAction, uploadBrandImageAction } from "@/server/actions/organization";
import { respondDeclaredAction } from "@/server/actions/org-team";
import {
  transferPageOwnershipAction,
  updateCompanyPageAction,
  type PageActionResult,
} from "@/server/actions/org-page";
import { AeDialog, Avatar, initialsOf, Switch, Toast } from "./team";

export type CompanyPageData = {
  org: {
    name: string;
    logo: string | null;
    banner: string | null;
    bannerTheme: string | null;
    sector: string;
    size: string;
    city: string;
    website: string;
    description: string;
    hiringNow: boolean;
    verification: "none" | "pending" | "verified" | "rejected" | "info_requested";
  };
  /** The line under the name: sector and city. */
  line: string;
  sizes: { value: string; label: string }[];
  pending: { experienceId: string; name: string; title: string }[];
  confirmed: string[];
  /** The owner only: the members the page can go to. */
  transferTo: { id: string; name: string }[] | null;
  /** Texts of the image window (shared with the job editor). */
  brand: {
    banner: string;
    logo: string;
    bannerHint: string;
    logoHint: string;
    choose: string;
    empty: string;
    cancel: string;
    save: string;
    removeBanner: string;
    removeLogo: string;
    error: string;
  };
};

const Eye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const Camera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 8h3l2-3h6l2 3h3v11H4V8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const Check = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m5 12.5 4.5 4.5L19 7.5"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** The logo, or the company's initials on Sapin. */
export function CompanyMark({
  name,
  logo,
  className,
}: {
  name: string;
  logo: string | null;
  className: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- the logo is a small WebP already sized. */}
      {logo ? <img src={logo} alt="" /> : initialsOf(name)}
    </span>
  );
}

/**
 * The banner or the logo: pick an image, it is cropped to its format from the center on the
 * server (3:1 or square), or removed. The page refreshes once saved.
 */
function ImageDialog({
  kind,
  current,
  texts,
  onClose,
  onDone,
}: {
  kind: "banner" | "logo" | null;
  current: string | null;
  texts: CompanyPageData["brand"];
  onClose: () => void;
  onDone: (result: { ok: boolean; text: string }) => void;
}) {
  const t = useTranslations("orgPage");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const inputId = useId();
  const preview = file ? URL.createObjectURL(file) : current;
  const send = (remove: boolean) =>
    start(async () => {
      if (!kind) return;
      const form = new FormData();
      form.set("kind", kind);
      if (!remove && file) form.set("image", file);
      const result = remove
        ? await removeBrandImageAction(form)
        : await uploadBrandImageAction(form);
      if (!result.ok) {
        setError(true);
        return;
      }
      onDone({ ok: true, text: t("saved") });
    });
  return (
    <AeDialog
      open={kind !== null}
      onClose={onClose}
      title={kind === "logo" ? texts.logo : texts.banner}
      width={520}
    >
      <p className="ae-dialog-texte">{kind === "logo" ? texts.logoHint : texts.bannerHint}</p>
      <div className={kind === "logo" ? "ae-pe-cadre ae-pe-cadre-logo" : "ae-pe-cadre"}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file.
          <img src={preview} alt="" />
        ) : (
          <span className="ae-meta">{texts.empty}</span>
        )}
      </div>
      <label htmlFor={inputId} className="ae-btn2 ae-btn-m ae-pe-choisir">
        {texts.choose}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="ae-sr"
        onChange={(event) => {
          setError(false);
          setFile(event.target.files?.[0] ?? null);
        }}
      />
      {error && (
        <p role="alert" className="ae-erreur">
          {texts.error}
        </p>
      )}
      <div className="ae-dialog-actions">
        {current && (
          <button
            type="button"
            className="ae-lien-doux ae-grandit"
            disabled={pending}
            onClick={() => send(true)}
          >
            {kind === "logo" ? texts.removeLogo : texts.removeBanner}
          </button>
        )}
        <button type="button" className="ae-btn2 ae-btn-m" onClick={onClose}>
          {texts.cancel}
        </button>
        <button
          type="button"
          className="ae-btn ae-btn-m"
          disabled={!file || pending}
          onClick={() => send(false)}
        >
          {texts.save}
        </button>
      </div>
    </AeDialog>
  );
}

/**
 * Page entreprise · modifier (étape 3, A3, capture 081): the banner and the logo, the fields of the
 * page, the « Recrute en ce moment » badge, then on the right the people who say they work there,
 * the verification, the confirmed members and, for the owner, the transfer of the page.
 */
export function CompanyPageEditor({ data }: { data: CompanyPageData }) {
  const t = useTranslations("orgPage");
  const { org } = data;
  const [form, setForm] = useState({
    name: org.name,
    sector: org.sector,
    size: org.size,
    city: org.city,
    website: org.website.replace(/^https?:\/\//, ""),
    description: org.description,
    hiringNow: org.hiringNow,
  });
  const [invalid, setInvalid] = useState<string | null>(null);
  const [image, setImage] = useState<"banner" | "logo" | null>(null);
  const [transfer, setTransfer] = useState(false);
  const [to, setTo] = useState(data.transferTo?.[0]?.id ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fieldId = useId();

  const act = (work: () => Promise<PageActionResult>, after?: () => void) =>
    start(async () => {
      const result = await work();
      setToast(result.text);
      if (result.ok) after?.();
    });

  const publish = (event: FormEvent) => {
    event.preventDefault();
    start(async () => {
      const result = await updateCompanyPageAction(form);
      setToast(result.text);
      setInvalid(result.ok ? null : (result.field ?? null));
    });
  };

  const text = (name: "name" | "sector" | "city" | "website", label: string, max: number) => (
    <div>
      <label htmlFor={`${fieldId}-${name}`} className="ae-lab">
        {label}
      </label>
      <input
        id={`${fieldId}-${name}`}
        className="ae-in"
        value={form[name]}
        maxLength={max}
        required={name === "name"}
        aria-invalid={invalid === name || undefined}
        onChange={(event) => setForm({ ...form, [name]: event.target.value })}
      />
    </div>
  );

  const status = org.verification;
  return (
    <div className="ae-app ae-page" aria-busy={pending}>
      <h1 className="ae-h1">{t("title")}</h1>
      <div className="ae-deux ae-deux-haut ae-pe">
        <div className="ae-grandit">
          <section className="ae-carte ae-pe-identite" aria-label={org.name}>
            <div
              className="ae-pe-ban"
              style={{ backgroundImage: bannerBackground(org.banner, org.bannerTheme) }}
            >
              <button type="button" className="ae-pe-sur" onClick={() => setImage("banner")}>
                <Camera />
                {t("banner.change")}
              </button>
            </div>
            <div className="ae-pe-tete">
              <CompanyMark name={org.name} logo={org.logo} className="ae-pe-logo" />
              <div className="ae-grandit">
                <p className="ae-pe-nom">{org.name}</p>
                {data.line && <p className="ae-meta">{data.line}</p>}
              </div>
              <button type="button" className="ae-btn2 ae-btn-s" onClick={() => setImage("logo")}>
                {t("logo.change")}
              </button>
            </div>
          </section>

          <form className="ae-carte ae-pe-form" aria-label={t("form.aria")} onSubmit={publish}>
            <div className="ae-pe-champs">
              {text("name", t("field.name"), 120)}
              {text("sector", t("field.sector"), 120)}
              <div>
                <label htmlFor={`${fieldId}-size`} className="ae-lab">
                  {t("field.size")}
                </label>
                <select
                  id={`${fieldId}-size`}
                  className="ae-in ae-pe-select"
                  value={form.size}
                  onChange={(event) => setForm({ ...form, size: event.target.value })}
                >
                  <option value="">{t("field.sizeNone")}</option>
                  {data.sizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
              {text("city", t("field.city"), 120)}
              {text("website", t("field.website"), 200)}
            </div>
            <label htmlFor={`${fieldId}-description`} className="ae-lab">
              {t("field.description")}
            </label>
            <textarea
              id={`${fieldId}-description`}
              className="ae-ta"
              rows={3}
              maxLength={3000}
              value={form.description}
              placeholder={t("field.descriptionPlaceholder")}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <div className="ae-rangee ae-pe-badge">
              <div className="ae-grandit">
                <p className="ae-nom">{t("hiring.label")}</p>
                <p className="ae-meta">{t("hiring.hint")}</p>
              </div>
              <Switch
                on={form.hiringNow}
                label={t("hiring.label")}
                onToggle={() => setForm({ ...form, hiringNow: !form.hiringNow })}
              />
            </div>
            <div className="ae-rangee ae-pe-pied">
              <Link href="/app/organisation/apercu" className="ae-btn2 ae-btn-m">
                <Eye />
                {t("preview")}
              </Link>
              <span className="ae-grandit" />
              <button type="submit" className="ae-btn ae-btn-m" disabled={pending}>
                {t("publish")}
              </button>
            </div>
          </form>
        </div>

        <aside className="ae-pe-cote">
          <section className="ae-carte" aria-labelledby={`${fieldId}-declared`}>
            <h2 id={`${fieldId}-declared`} className="ae-h2">
              {t("declared.title")}
            </h2>
            <p className="ae-meta ae-pe-intro">{t("declared.text")}</p>
            {data.pending.length === 0 ? (
              <p className="ae-vide-ligne">{t("declared.empty")}</p>
            ) : (
              <ul className="ae-pe-decl">
                {data.pending.map((person) => (
                  <li key={person.experienceId} className="ae-pe-personne">
                    <div className="ae-ligne">
                      <Avatar name={person.name} soft />
                      <div className="ae-grandit">
                        <p className="ae-nom">{person.name}</p>
                        <p className="ae-meta">
                          {t("declared.line", { org: org.name, title: person.title })}
                        </p>
                      </div>
                    </div>
                    <div className="ae-rangee ae-pe-reponse">
                      <button
                        type="button"
                        className="ae-btn2 ae-btn-s"
                        aria-label={t("declared.noAria", { name: person.name })}
                        disabled={pending}
                        onClick={() =>
                          act(() =>
                            respondDeclaredAction({
                              experienceId: person.experienceId,
                              confirm: false,
                            }),
                          )
                        }
                      >
                        {t("declared.no")}
                      </button>
                      <button
                        type="button"
                        className="ae-btn ae-btn-s"
                        aria-label={t("declared.yesAria", { name: person.name })}
                        disabled={pending}
                        onClick={() =>
                          act(() =>
                            respondDeclaredAction({
                              experienceId: person.experienceId,
                              confirm: true,
                            }),
                          )
                        }
                      >
                        {t("declared.yes")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ae-carte" aria-labelledby={`${fieldId}-verif`}>
            <h2 id={`${fieldId}-verif`} className="ae-h2 ae-ligne ae-ligne-s">
              {status === "verified" && (
                <span className="ae-pe-ok">
                  <Check />
                </span>
              )}
              {t(`verification.${status}.title`)}
            </h2>
            <p className="ae-meta ae-pe-intro">{t(`verification.${status}.text`)}</p>
            {status !== "verified" && (
              <Link
                href="/app/organisation/verification"
                className={status === "pending" ? "ae-btn2 ae-btn-s" : "ae-btn ae-btn-s"}
              >
                {status === "none" ? t("verification.action") : t("verification.follow")}
              </Link>
            )}
          </section>

          <section className="ae-carte" aria-labelledby={`${fieldId}-confirmed`}>
            <h2 id={`${fieldId}-confirmed`} className="ae-h2">
              {t("confirmed.title")}
            </h2>
            <ul
              className="ae-pe-avs"
              aria-label={t("confirmed.aria", { count: data.confirmed.length })}
            >
              {data.confirmed.map((name, index) => (
                <li key={`${name}-${index}`} title={name}>
                  <span
                    className={index === 0 ? "ae-av ae-pe-av ae-pe-av-1" : "ae-av ae-pe-av"}
                    aria-hidden="true"
                  >
                    {initialsOf(name)}
                  </span>
                  <span className="ae-sr">{name}</span>
                </li>
              ))}
            </ul>
          </section>

          {data.transferTo && (
            <section className="ae-carte" aria-labelledby={`${fieldId}-owner`}>
              <h2 id={`${fieldId}-owner`} className="ae-h2">
                {t("owner.title")}
              </h2>
              <p className="ae-meta ae-pe-intro">
                {data.transferTo.length > 0 ? t("owner.text") : t("owner.alone")}
              </p>
              {data.transferTo.length > 0 && (
                <button
                  type="button"
                  className="ae-btn2 ae-btn-s"
                  onClick={() => setTransfer(true)}
                >
                  {t("owner.action")}
                </button>
              )}
            </section>
          )}
        </aside>
      </div>

      <ImageDialog
        key={image ?? "ferme"}
        kind={image}
        current={image === "logo" ? org.logo : image === "banner" ? org.banner : null}
        texts={data.brand}
        onClose={() => setImage(null)}
        onDone={(result) => {
          setImage(null);
          setToast(result.text);
        }}
      />

      <AeDialog open={transfer} onClose={() => setTransfer(false)} title={t("owner.dialog")}>
        <p className="ae-dialog-texte">{t("owner.text")}</p>
        <div role="radiogroup" aria-label={t("owner.to")} className="ae-pills">
          {(data.transferTo ?? []).map((member) => (
            <button
              key={member.id}
              type="button"
              role="radio"
              aria-checked={to === member.id}
              className="ae-pill"
              onClick={() => setTo(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>
        <div className="ae-dialog-actions">
          <button type="button" className="ae-btn2 ae-btn-m" onClick={() => setTransfer(false)}>
            {t("owner.cancel")}
          </button>
          <button
            type="button"
            className="ae-btn ae-btn-m"
            disabled={!to || pending}
            onClick={() =>
              act(
                () => transferPageOwnershipAction(to),
                () => setTransfer(false),
              )
            }
          >
            {t("owner.confirm")}
          </button>
        </div>
      </AeDialog>

      {toast && <Toast text={toast} onClose={() => setToast(null)} label={t("close")} />}
    </div>
  );
}

export type CompanyPreviewData = {
  org: {
    name: string;
    logo: string | null;
    banner: string | null;
    bannerTheme: string | null;
    description: string;
    website: string;
    hiringNow: boolean;
    verified: boolean;
  };
  /** Sector, city and size. */
  line: string;
  members: { id: string; name: string; title: string | null; confirmed: boolean }[];
  offers: { id: string; title: string; line: string }[];
};

type PreviewTab = "apropos" | "membres" | "offres";

/**
 * Page entreprise · vue publique (étape 3, A3, capture 082): the page as a talent sees it, with
 * « À propos », « Membres » (confirmed by the company, or « Indiqué par la personne ») and « Offres ».
 */
export function CompanyPreview({
  data,
  initialTab,
}: {
  data: CompanyPreviewData;
  initialTab: PreviewTab;
}) {
  const t = useTranslations("orgPage.view");
  const [tab, setTab] = useState<PreviewTab>(initialTab);
  const tabsId = useId();
  const { org } = data;
  const tabs: { key: PreviewTab; label: string; count?: number }[] = [
    { key: "apropos", label: t("tabs.about") },
    { key: "membres", label: t("tabs.members"), count: data.members.length },
    { key: "offres", label: t("tabs.offers"), count: data.offers.length },
  ];
  return (
    <div className="ae-app ae-page">
      <Link href="/app/organisation" className="ae-pv-retour">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {t("back")}
      </Link>
      <div
        className="ae-pv-ban"
        style={{ backgroundImage: bannerBackground(org.banner, org.bannerTheme) }}
      />
      <div className="ae-pv-tete">
        <CompanyMark name={org.name} logo={org.logo} className="ae-pv-logo" />
        <div className="ae-grandit">
          <h1 className="ae-pv-nom">
            {org.name}
            {org.verified && (
              <span className="ae-pe-ok" role="img" aria-label={t("verified")}>
                <Check size={20} />
              </span>
            )}
          </h1>
          {data.line && <p className="ae-meta">{data.line}</p>}
        </div>
        {org.hiringNow && <span className="ae-tag ae-tag-lime">{t("hiring")}</span>}
      </div>

      <div role="tablist" aria-label={t("tabs.aria")} className="ae-seg ae-pv-seg">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${tabsId}-${item.key}`}
            aria-selected={tab === item.key}
            aria-controls={`${tabsId}-panel`}
            onClick={() => setTab(item.key)}
            className={tab === item.key ? "ae-seg-on" : undefined}
          >
            {item.label}
            {item.count !== undefined && <span className="ae-seg-n">{item.count}</span>}
            {tab === item.key && <i aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-${tab}`}
        className="ae-panneau"
      >
        {tab === "apropos" && (
          <div className="ae-carte ae-pv-apropos">
            <p>{org.description || t("noAbout")}</p>
            {org.website && (
              <p className="ae-meta">
                {t("site", { site: org.website.replace(/^https?:\/\//, "") })}
              </p>
            )}
          </div>
        )}
        {tab === "membres" &&
          (data.members.length === 0 ? (
            <p className="ae-vide-ligne ae-meta">{t("noMembers")}</p>
          ) : (
            <ul className="ae-g4">
              {data.members.map((member, index) => (
                <li key={member.id} className="ae-carte ae-pv-membre">
                  <span
                    className={index === 0 ? "ae-av ae-pv-av ae-pe-av-1" : "ae-av ae-pv-av"}
                    aria-hidden="true"
                  >
                    {initialsOf(member.name)}
                  </span>
                  <p className="ae-nom">{member.name}</p>
                  {member.title && <p className="ae-meta">{member.title}</p>}
                  <p className={member.confirmed ? "ae-pv-conf" : "ae-pv-decl"}>
                    {member.confirmed ? t("confirmedBy", { org: org.name }) : t("declared")}
                  </p>
                </li>
              ))}
            </ul>
          ))}
        {tab === "offres" &&
          (data.offers.length === 0 ? (
            <p className="ae-vide-ligne ae-meta">{t("noOffers")}</p>
          ) : (
            <ul className="ae-pv-offres">
              {data.offers.map((offer) => (
                <li key={offer.id}>
                  <Link href={`/app/hire/offres/${offer.id}`} className="ae-carte ae-pv-offre">
                    <span className="ae-nom">{offer.title}</span>
                    {offer.line && <span className="ae-meta">{offer.line}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
