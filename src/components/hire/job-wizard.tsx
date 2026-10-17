"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { AiOrb } from "@/components/brand/ai-orb";
import { pillClass } from "@/components/career/kit";
import { cx } from "@/lib/cx";
import { jobWriterAction } from "@/server/actions/hire";
import type { JobSuggestion } from "@/server/services/job-writer";
import { JOB_STEPS } from "./job-steps";
import { JobBannerCard, jobCardSaveClass } from "@/components/jobs/job-banner-card";
import { BrandIdentity, type JobBrand } from "./brand-identity";

type Readiness = "ready" | "consent" | "locked" | "quota";
type Values = {
  title: string;
  city: string;
  country: string;
  contract: string;
  workMode: string;
  salaryMin: string;
  salaryMax: string;
  closesAt: string;
  requiredSkills: string;
};

const empty: Values = {
  title: "",
  city: "",
  country: "",
  contract: "",
  workMode: "",
  salaryMin: "",
  salaryMax: "",
  closesAt: "",
  requiredSkills: "",
};

const BENEFITS_EVENT = "jm:benefits-add";
const card = "rounded-[24px] bg-blanc p-5 lg:p-[22px]";

/**
 * Guided job form in six steps (partie 07 § 4, mockup 04-03). The fields are one server form
 * (`children`, one `[data-step]` section per step): this component shows one step at a time,
 * checks the step before « Continuer », keeps the live preview and the « Avant de publier » list
 * up to date, and runs the help to write with Jumanly Intelligence. Without JavaScript every step
 * is shown on one page and the form still works.
 */
export function JobWizard({
  formId,
  initialStep,
  org,
  verified,
  brand,
  readiness,
  credits,
  lockText,
  savedAt,
  templates,
  children,
}: {
  formId: string;
  initialStep: number;
  org: string;
  verified: boolean;
  brand: JobBrand;
  readiness: Readiness;
  credits: number;
  /** Why the help to write is not available (plan, credits). */
  lockText: string;
  savedAt: Date | null;
  /** « Partir d'une offre existante » menu, drawn by the page. */
  templates?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("hire.jobForm");
  const tAi = useTranslations("ai");
  const format = useFormatter();
  const [step, setStep] = useState(initialStep);
  const [values, setValues] = useState<Values>(empty);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<JobSuggestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const shell = useRef<HTMLDivElement>(null);

  const form = useCallback(
    () => document.getElementById(formId) as HTMLFormElement | null,
    [formId],
  );
  const field = useCallback(
    (name: string) =>
      form()?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null,
    [form],
  );

  // Live preview: read the form on every change.
  useEffect(() => {
    const node = form();
    if (!node) return;
    const read = () => {
      const data = new FormData(node);
      const text = (name: string) => String(data.get(name) ?? "").trim();
      const option = (name: string) => {
        const select = node.elements.namedItem(name) as HTMLSelectElement | null;
        return select?.selectedOptions[0]?.textContent ?? "";
      };
      setValues({
        title: text("title"),
        city: text("city"),
        country: text("country"),
        contract: option("contractType"),
        workMode: option("remote"),
        salaryMin: text("salaryMin"),
        salaryMax: text("salaryMax"),
        closesAt: text("closesAt"),
        requiredSkills: text("requiredSkills"),
      });
    };
    read();
    node.addEventListener("input", read);
    node.addEventListener("change", read);
    return () => {
      node.removeEventListener("input", read);
      node.removeEventListener("change", read);
    };
  }, [form]);

  // One step at a time; an invalid field on submit opens its step.
  useEffect(() => {
    const node = form();
    if (!node) return;
    for (const section of node.querySelectorAll<HTMLElement>("[data-step]")) {
      section.hidden = Number(section.dataset.step) !== step;
    }
    const onInvalid = (event: Event) => {
      const target = event.target as HTMLElement;
      const owner = target.closest<HTMLElement>("[data-step]");
      const wanted = Number(owner?.dataset.step ?? step);
      if (wanted !== step) {
        event.preventDefault();
        setStep(wanted);
        requestAnimationFrame(() => (target as HTMLInputElement).reportValidity?.());
      }
    };
    // The certification is asked to publish, not to save a draft.
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        "button[name=intent]",
      );
      const certify = node.elements.namedItem("certify") as HTMLInputElement | null;
      if (button && certify) certify.required = button.value === "publish";
    };
    node.addEventListener("invalid", onInvalid, true);
    document.addEventListener("click", onClick, true);
    return () => {
      node.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [form, step]);

  const go = (next: number) => {
    setStep(next);
    setNotice(null);
    shell.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const advance = () => {
    const section = form()?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const fields = section
      ? [...section.querySelectorAll<HTMLInputElement>("input, select, textarea")]
      : [];
    const bad = fields.find((item) => !item.checkValidity());
    if (bad) {
      bad.reportValidity();
      return;
    }
    go(Math.min(JOB_STEPS.length, step + 1));
  };

  const lines = (name: string) =>
    String(field(name)?.value ?? "")
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  const setField = (name: string, value: string) => {
    const node = field(name);
    if (!node) return;
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const request = (mode: "draft" | "improve") => {
    setAiError(null);
    setNotice(null);
    if (values.title.length < 3) {
      setAiError(t("ai.needTitle"));
      return;
    }
    if (mode === "improve" && lines("responsibilities").length === 0) {
      setAiError(t("ai.needMissions"));
      return;
    }
    startTransition(async () => {
      const result = await jobWriterAction({
        mode,
        title: values.title,
        contract: values.contract,
        workMode: values.workMode,
        city: values.city,
        country: values.country,
        description: String(field("description")?.value ?? ""),
        responsibilities: lines("responsibilities"),
        requirements: lines("requirements"),
      }).catch(() => ({ ok: false as const, error: "unavailable" as const }));
      if (!result.ok) {
        setAiError(
          result.error === "quota" || result.error === "entitlement"
            ? lockText
            : result.error === "consent"
              ? t("ai.consent")
              : tAi("card.error"),
        );
        return;
      }
      if (result.mode === "improve") {
        setSuggestions(result.suggestions);
        setIndex(0);
        return;
      }
      let added = false;
      const fill = (name: string, value: string) => {
        if (!value || String(field(name)?.value ?? "").trim()) return;
        setField(name, value);
        added = true;
      };
      fill("description", result.draft.description);
      fill("responsibilities", result.draft.responsibilities.join("\n"));
      fill("requirements", result.draft.requirements.join("\n"));
      if (result.draft.benefits.length > 0) {
        window.dispatchEvent(new CustomEvent(BENEFITS_EVENT, { detail: result.draft.benefits }));
        added = true;
      }
      setNotice(added ? t("ai.drafted") : t("ai.draftNothing"));
    });
  };
  const current = suggestions?.[index];
  const apply = () => {
    if (!current) return;
    setField(
      "responsibilities",
      lines("responsibilities")
        .map((line) => (line === current.before ? current.after : line))
        .join("\n"),
    );
    setIndex(index + 1);
  };

  const ready = readiness === "ready";
  const blocked =
    readiness === "consent" ? t("ai.consent") : readiness === "ready" ? null : lockText;
  const checks = [
    { key: "title", ok: values.title.length >= 3 },
    { key: "skills", ok: values.requiredSkills.length > 0 },
    { key: "salary", ok: Boolean(values.salaryMin || values.salaryMax) },
    { key: "location", ok: Boolean(values.city && values.country) },
    { key: "deadline", ok: Boolean(values.closesAt) },
  ] as const;
  const stepName = (at: number) => t(`step.${JOB_STEPS[at - 1]!}`);

  const improveCard = (
    <section
      aria-labelledby="job-ai-title"
      className="relative flex flex-col gap-3 overflow-hidden rounded-[24px] bg-gradient-ai p-5 text-blanc lg:p-[22px]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full ring-1 ring-blanc/20"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
          <AiOrb size={26} />
          {tAi("brand")}
        </p>
        {suggestions && suggestions.length > 0 && current && (
          <span className="rounded-pill bg-blanc/12 px-2.5 py-1 text-[11px] font-semibold">
            {tAi("card.counter", { current: index + 1, total: suggestions.length })}
          </span>
        )}
      </div>
      <h2 id="job-ai-title" className="relative text-[18px] leading-6 font-semibold">
        {t("description.aiImprove")}
      </h2>
      <div className="relative flex flex-col gap-3" aria-live="polite">
        {pending ? (
          <p className="flex items-center gap-2 text-[13px] text-blanc/85">
            <span className="jm-orb inline-block size-3 rounded-full bg-lime" />
            {tAi("card.loading")}
          </p>
        ) : current ? (
          <>
            <div className="flex flex-col gap-1.5 rounded-[16px] bg-sapin/55 p-3.5 text-[13px] leading-[19px]">
              <del className="text-[11.5px] text-blanc/60">{current.before}</del>
              <ins className="no-underline">{current.after}</ins>
            </div>
            <p className="flex gap-2 text-[12px] leading-[17px] text-blanc/85">
              <Icon name="eye" className="mt-px size-4 shrink-0 text-neon" />
              <span>
                <strong className="text-blanc">{tAi("card.why")}</strong> {current.why}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={apply} className={pillClass("lime", "sm")}>
                {tAi("card.apply")}
              </button>
              <button
                type="button"
                onClick={() => setIndex(index + 1)}
                className={pillClass("ghost", "sm")}
              >
                {tAi("card.ignore")}
              </button>
              {index + 1 < (suggestions?.length ?? 0) && (
                <button
                  type="button"
                  onClick={() => setIndex(index + 1)}
                  className="ml-auto flex items-center gap-1 text-[12px] text-blanc/80 hover:text-blanc"
                >
                  {tAi("card.next")}
                  <Icon name="chev-r" className="size-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-[13px] leading-[19px] text-blanc/85">
              {suggestions ? t("ai.improveEmpty") : t("ai.improveIntro")}
            </p>
            <button
              type="button"
              disabled={!ready}
              onClick={() => request("improve")}
              className={pillClass("lime", "sm", "self-start")}
            >
              <Icon name="intelligence" className="size-4" />
              {t("description.aiImprove")}
            </button>
          </>
        )}
        {(aiError || blocked) && (
          <p role="alert" className="text-[12px] leading-[17px] text-neon">
            {aiError ?? blocked}
          </p>
        )}
      </div>
      <p className="relative text-[11px] leading-[15px] text-blanc/70">
        {[tAi("disclaimer.short"), tAi("credits.cost.text", { count: credits })].join(" · ")}
      </p>
    </section>
  );

  return (
    <div ref={shell} className="flex scroll-mt-28 flex-col gap-4 lg:gap-5">
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>[data-step]{display:flex!important}[data-js]{display:none!important}</style>",
        }}
      />
      <section aria-label={t("step.aria")} className={cx(card, "flex flex-col gap-4")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-ardoise lg:text-[13px]">
            <strong className="font-semibold text-sapin max-lg:hidden">
              {t("step.text", { current: step, total: JOB_STEPS.length })}
            </strong>
            <strong className="font-semibold text-sapin lg:hidden">
              {t("step.current", {
                current: step,
                total: JOB_STEPS.length,
                step: stepName(step),
              })}
            </strong>
            {values.title && (
              <span className="max-lg:hidden">{["", values.title].join(" · ")}</span>
            )}
          </p>
          {savedAt && (
            <span className="text-[11px] text-ardoise lg:hidden">
              {t("draftSavedAt", { time: format.relativeTime(savedAt) })}
            </span>
          )}
          {templates && <div className="max-lg:hidden">{templates}</div>}
        </div>
        <ol data-js className="flex gap-1.5 lg:hidden">
          {JOB_STEPS.map((key, at) => (
            <li
              key={key}
              aria-current={at + 1 === step ? "step" : undefined}
              className={cx(
                "h-1.5 flex-1 rounded-pill",
                at + 1 < step ? "bg-sapin" : at + 1 === step ? "bg-lime" : "bg-gris-clair",
              )}
            >
              <span className="sr-only">{stepName(at + 1)}</span>
            </li>
          ))}
        </ol>
        <ol data-js className="relative hidden grid-cols-6 lg:grid">
          <span
            aria-hidden
            className="absolute top-4 right-[8.33%] left-[8.33%] h-0.5 bg-gris-clair"
          />
          <span
            aria-hidden
            className="jm-gauge absolute top-4 left-[8.33%] h-0.5 origin-left bg-lime transition-[width] duration-500"
            style={{ width: `${(83.33 * (step - 1)) / (JOB_STEPS.length - 1)}%` }}
          />
          {JOB_STEPS.map((key, at) => {
            const done = at + 1 < step;
            const now = at + 1 === step;
            return (
              <li key={key} className="relative flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => (at + 1 < step ? go(at + 1) : undefined)}
                  aria-current={now ? "step" : undefined}
                  disabled={at + 1 > step}
                  className={cx(
                    "grid size-8 place-items-center rounded-full text-[12px] font-semibold transition-colors",
                    done && "bg-lime text-sapin",
                    now && "bg-sapin text-blanc ring-4 ring-lime/50",
                    !done && !now && "bg-blanc text-ardoise ring-[1.5px] ring-brume",
                  )}
                >
                  {done ? <Icon name="check" className="size-4" /> : at + 1}
                  <span className="sr-only">{stepName(at + 1)}</span>
                </button>
                <span
                  aria-hidden
                  className={cx("text-[12px]", now ? "font-semibold text-sapin" : "text-ardoise")}
                >
                  {stepName(at + 1)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          {step === 2 && (
            <div
              data-js
              className="flex items-center gap-3 rounded-[22px] bg-blanc p-4 ring-[1.5px] ring-brume ring-inset"
            >
              <AiOrb size={30} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[13.5px] leading-[19px] font-semibold">{t("aiDraft")}</p>
                <p className="text-[11.5px] leading-4 text-ardoise">{t("ai.draftHint")}</p>
              </div>
              <button
                type="button"
                disabled={!ready || pending}
                onClick={() => request("draft")}
                className={pillClass("dark", "sm")}
              >
                {t("ai.draftCta")}
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className="rounded-[16px] bg-lime-clair px-4 py-3 text-[13px]">
              {notice}
            </p>
          )}
          {children}
          <div className="flex flex-wrap items-center gap-2.5" data-js>
            <button
              type="button"
              onClick={() => go(Math.max(1, step - 1))}
              disabled={step === 1}
              className={pillClass("outline", "md", "max-lg:flex-1")}
            >
              <Icon name="chev-l" className="size-4" />
              {t("back")}
            </button>
            {savedAt && (
              <span className="flex items-center gap-1.5 text-[11.5px] text-ardoise max-lg:hidden">
                <Icon name="check" className="size-3.5 text-feuille-fonce" />
                {t("draftSavedAt", { time: format.relativeTime(savedAt) })}
              </span>
            )}
            <span className="flex-1 max-lg:hidden" />
            {step < JOB_STEPS.length && (
              <button
                type="submit"
                form={formId}
                name="intent"
                value="draft"
                className={pillClass("outline", "md", "max-lg:hidden")}
              >
                {t("saveDraft")}
              </button>
            )}
            {step < JOB_STEPS.length && (
              <button
                type="button"
                onClick={advance}
                className={pillClass("lime", "md", "max-lg:flex-1")}
              >
                {t("next")}
                <Icon name="chev-r" className="size-4" />
              </button>
            )}
          </div>
          {step === 2 && <div className="lg:hidden">{improveCard}</div>}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          {step === 2 && <div className="max-lg:hidden">{improveCard}</div>}
          <section
            aria-labelledby="job-preview"
            className={cx(
              card,
              "flex flex-col gap-3",
              step !== JOB_STEPS.length && "max-lg:hidden",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="job-preview" className="text-[15px] font-semibold">
                {t("preview.title")}
              </h2>
              <span className="text-[11px] text-ardoise">
                {[t("preview.desktop"), t("preview.mobile")].join(" · ")}
              </span>
            </div>
            {/* Screen 66: the company's identity, then the card as talents will see it. */}
            <BrandIdentity org={org} brand={brand} />
            <h3 className="text-[13px] font-semibold text-ardoise">{t("preview.inJobs")}</h3>
            <JobBannerCard
              href={null}
              title={values.title || t("jobTitle.text")}
              company={org}
              verified={verified ? t("preview.verified") : null}
              banner={brand.banner}
              logo={brand.logo}
              chips={[
                { label: values.city || t("preview.city"), icon: "localisation" },
                ...[values.contract, values.workMode]
                  .filter((item): item is string => Boolean(item))
                  .map((label) => ({ label })),
              ]}
              when={t("preview.today")}
              cta={t("preview.see")}
              save={
                <span aria-hidden className={jobCardSaveClass}>
                  <Icon name="favori" className="size-5" />
                </span>
              }
            />
            <h3 className="mt-1 text-[11px] font-semibold tracking-[0.09em] text-ardoise uppercase">
              {t("preview.checklist")}
            </h3>
            <ul className="flex flex-col gap-2">
              {checks.map((item) => (
                <li key={item.key} className="flex items-center gap-2.5 text-[13px]">
                  <Icon
                    name={item.ok ? "check" : "horloge"}
                    className={cx(
                      "size-4 shrink-0",
                      item.ok ? "text-feuille-fonce" : "text-ardoise",
                    )}
                  />
                  <span className={item.ok ? "text-sapin" : "text-ardoise"}>
                    {t(`preview.check.${item.key}`)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex gap-2 border-t border-gris-clair pt-3 text-[11.5px] leading-4 text-ardoise">
              <Icon name="check" className="size-3.5 shrink-0 text-feuille-fonce" />
              {t("publish.free")}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

/** « Avantages » as chips; the value is sent one per line in `name`. */
export function ChipLines({
  name,
  initial,
  label,
  placeholder,
}: {
  name: string;
  initial: string[];
  label: string;
  placeholder: string;
}) {
  const t = useTranslations("hire.jobForm");
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onAdd = (event: Event) => {
      const more = (event as CustomEvent<string[]>).detail;
      setItems((list) => [...list, ...more.filter((item) => !list.includes(item))].slice(0, 15));
    };
    window.addEventListener(BENEFITS_EVENT, onAdd);
    return () => window.removeEventListener(BENEFITS_EVENT, onAdd);
  }, []);
  const add = () => {
    const value = draft.trim();
    if (value && !items.includes(value)) setItems([...items, value].slice(0, 15));
    setDraft("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-semibold">{label}</legend>
      <textarea name={name} value={items.join("\n")} readOnly hidden />
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex h-[34px] items-center gap-2 rounded-pill bg-sapin pr-1.5 pl-3.5 text-[12.5px] font-medium text-blanc"
          >
            {item}
            <button
              type="button"
              onClick={() => setItems(items.filter((other) => other !== item))}
              aria-label={t("benefits.remove", { benefit: item })}
              className="grid size-6 place-items-center rounded-full hover:bg-blanc/15"
            >
              <Icon name="fermer" className="size-3.5" />
            </button>
          </li>
        ))}
        <li>
          {open ? (
            <span className="flex h-[34px] items-center gap-1 rounded-pill bg-blanc pr-1 pl-3 ring-[1.5px] ring-brume ring-inset">
              <label htmlFor={`${name}-new`} className="sr-only">
                {t("benefits.add")}
              </label>
              <input
                ref={input}
                id={`${name}-new`}
                value={draft}
                maxLength={80}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => {
                  add();
                  setOpen(false);
                }}
                placeholder={placeholder}
                className="h-full w-52 bg-transparent text-[12.5px] outline-none placeholder:text-ardoise"
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                requestAnimationFrame(() => input.current?.focus());
              }}
              className="flex h-[34px] items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-medium ring-[1.5px] ring-brume ring-inset hover:bg-lime-clair"
            >
              <Icon name="plus" className="size-3.5" />
              {t("benefits.add")}
            </button>
          )}
        </li>
      </ul>
    </fieldset>
  );
}

/** Link back to the list, kept for the « Quitter ? » wording of the mockup. */
export function WizardBack({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-[12px] text-ardoise hover:text-sapin">
      <Icon name="chev-l" className="size-3.5" />
      {label}
    </Link>
  );
}
