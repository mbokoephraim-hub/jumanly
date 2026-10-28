import { useTranslations } from "next-intl";
import { ButtonLink, SearchField } from "@/components/ui";
import { SystemActions, SystemCode, SystemHero } from "./system-page";

/**
 * Page 404 (mockup 08-01): the public version has a search field (sent to the job offers, the
 * public search page); an offer or a course taken offline gets its own sentence and button.
 */
export function NotFoundContent({
  variant = "page",
  space = "public",
}: {
  variant?: "page" | "job" | "course";
  space?: "public" | "app";
}) {
  const t = useTranslations("system.404");
  const app = space === "app";
  const body = variant === "page" ? t("body") : t(variant);
  const second =
    variant === "course"
      ? { href: app ? "/app/learn" : "/formations", label: t("cta.courses") }
      : { href: app ? "/app/jobs" : "/offres", label: t("cta.jobs") };
  return (
    <SystemHero
      code={<SystemCode code={t("code")} />}
      title={t("title")}
      body={<p>{body}</p>}
      character={app ? { name: "fatou", pose: "perplexe" } : undefined}
      compact={app}
    >
      {!app && (
        <form
          action={variant === "course" ? "/formations" : "/offres"}
          className="flex w-full flex-col gap-2.5"
        >
          <p className="text-xs leading-[17px] text-ardoise">{t("search")}</p>
          <SearchField
            id={`introuvable-recherche-${variant}`}
            name="q"
            label={t("searchPlaceholder")}
            placeholder={t("searchPlaceholder")}
            className="[&_input]:h-[52px]"
          />
        </form>
      )}
      <SystemActions>
        <ButtonLink href={app ? "/app" : "/"} size="lg">
          {t("cta.home")}
        </ButtonLink>
        <ButtonLink href={second.href} size="lg" variant="tertiary">
          {second.label}
        </ButtonLink>
      </SystemActions>
    </SystemHero>
  );
}

/** The 404 block of the public site, on the Nuit page. */
export function NotFoundSection({ variant }: { variant?: "page" | "job" | "course" }) {
  return (
    <section className="w-full bg-papier px-4 pb-10 lg:pb-16">
      <div className="mx-auto max-w-[1400px] py-12 lg:py-[100px]">
        <div className="mx-auto max-w-[1248px]">
          <NotFoundContent variant={variant} />
        </div>
      </div>
    </section>
  );
}
