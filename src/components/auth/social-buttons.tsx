/* eslint-disable @next/next/no-img-element -- tiny static logos: next/image would add nothing */
import { cx } from "@/lib/cx";

export type SocialProvider = { id: string; label: string };

/**
 * « Continuer avec » and the providers configured on this server (docs/refonte-connexion § 6),
 * three to a row. Each button sends the form around it to its provider; on phones only the logo
 * shows, the name stays in `aria-label`. Apple's button is black, as Apple asks.
 */
export function SocialButtons({
  providers,
  label,
  aria,
  action,
}: {
  providers: SocialProvider[];
  label: string;
  /** « Continuer avec {provider} »: `{provider}` is replaced by each name. */
  aria: string;
  /** Server action, bound to each provider; it receives the fields of the form around. */
  action: (provider: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-[9px]">
      <p className="jm-ae-label">{label}</p>
      <div className="grid grid-cols-3 gap-2.5">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="submit"
            formAction={action.bind(null, provider.id)}
            aria-label={aria.replace("{provider}", provider.label)}
            className={cx("jm-ae-social", provider.id === "apple" && "jm-ae-apple")}
          >
            <img
              src={`/marque/fournisseurs/${provider.id}.svg`}
              alt=""
              width={20}
              height={20}
              className="size-5"
            />
            <span>{provider.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
