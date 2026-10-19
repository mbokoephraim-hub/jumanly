/* eslint-disable @next/next/no-img-element -- tiny static logos: next/image would add nothing */
import type { ReactNode } from "react";
import Link from "next/link";
import { TalentIcon } from "@/components/talent/icon";

/**
 * The mark of the planche (talent-4 `LOGO`): Sapin square, white j, Lime dot. « glass »: the square
 * of the brand panel, white at 14 % on Sapin (refonte-web talent-4 `VIT`).
 */
export function AccessMark({
  size = 40,
  tone = "sapin",
}: {
  size?: number;
  tone?: "sapin" | "glass";
}) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden focusable="false">
      {tone === "glass" ? (
        <rect width="120" height="120" rx="30" fill="#ffffff" fillOpacity=".14" />
      ) : (
        <rect width="120" height="120" rx="30" fill="#0F3F37" />
      )}
      <g transform="translate(2.25 -4.35) scale(1.1)">
        <path
          d="M70 55 V70 A19 19 0 0 1 33.15 76.50"
          fill="none"
          stroke="#fff"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <circle cx="70" cy="31" r="11.5" fill="#A6F26B" />
      </g>
    </svg>
  );
}

/** Head of « Bon retour » and « Créez votre compte » (planche `.auth-h`). */
export function AccessHead({
  brand,
  homeLabel,
  title,
  subtitle,
}: {
  brand: string;
  homeLabel: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="t-auth-h">
      <Link href="/" aria-label={homeLabel} className="t-lgo t-press">
        <AccessMark />
        <span aria-hidden>{brand}</span>
      </Link>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

/**
 * Head of a step (planche `tete_f`): the round « Retour » button and the name of the screen. From
 * the tablet on, the button becomes a text link (« Retour à la connexion », refonte-web talent-4)
 * and the name is kept for screen readers only: the question below is the visible title.
 */
export function AccessTop({
  back,
  backLabel,
  backText,
  title,
  end,
}: {
  back?: string;
  backLabel: string;
  /** Words of the link on a computer; `backLabel` by default. */
  backText?: string;
  title?: string;
  end?: ReactNode;
}) {
  return (
    <div className="t-tete-f">
      {back && (
        <Link href={back} aria-label={backText ?? backLabel} className="t-bi t-press">
          <TalentIcon name="retour" size="s" />
          <span className="t-tete-f-l" aria-hidden>
            {backText ?? backLabel}
          </span>
        </Link>
      )}
      {title ? <h1>{title}</h1> : <span className="flex-1" />}
      {end}
    </div>
  );
}

export type AccessProvider = { id: string; label: string };

/**
 * « Continuer avec Google / LinkedIn / Apple » (planche `.fourn`): only the providers configured on
 * this server. Each button sends the form around it to its provider.
 */
export function ProviderButtons({
  providers,
  action,
}: {
  /** `short`: the provider's name alone, shown side by side from the tablet on (« Se connecter »). */
  providers: (AccessProvider & { short?: string })[];
  action: (provider: string, formData: FormData) => Promise<void>;
}) {
  return providers.map((provider) => (
    <button
      key={provider.id}
      type="submit"
      formAction={action.bind(null, provider.id)}
      formNoValidate
      className="t-verre t-fourn t-press"
    >
      <img
        src={`/marque/fournisseurs/${provider.id}.svg`}
        alt=""
        width={22}
        height={22}
        className="size-[22px]"
      />
      <span className="t-fourn-l">{provider.label}</span>
      {provider.short && <span className="t-fourn-c">{provider.short}</span>}
    </button>
  ));
}

/** Bottom bar of a step (planche `.bas-f`). */
export function AccessBar({ children }: { children: ReactNode }) {
  return <div className="t-verre t-fort t-bas-f">{children}</div>;
}
