import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { CompanyLogo } from "@/components/ui";
import { switchSpace } from "@/server/actions/hire";
import { cx } from "@/lib/cx";

export type SpaceOption = { id: string; name: string; role: string };

/**
 * Space switcher (mockup 00-04): Personnel, then each organization, in a floating card. A native
 * disclosure with one form per space, so it works without JavaScript.
 */
export function SpaceSwitcher({
  current,
  spaces,
  tone,
}: {
  current: SpaceOption | null;
  spaces: SpaceOption[];
  tone: "light" | "dark";
}) {
  const t = useTranslations();
  if (spaces.length === 0) return null;
  const option = (space: SpaceOption | null) => {
    const active = (current?.id ?? null) === (space?.id ?? null);
    return (
      <li key={space?.id ?? "personal"}>
        <form action={switchSpace}>
          <input type="hidden" name="space" value={space?.id ?? "personal"} />
          <button
            type="submit"
            aria-current={active ? "true" : undefined}
            className={cx(
              "flex w-full items-center gap-2.5 rounded-[16px] px-3 py-2.5 text-left",
              active ? "bg-lime-clair" : "hover:bg-creme",
            )}
          >
            {space ? (
              <CompanyLogo name={space.name} size="sm" />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blanc">
                <Icon name="profil" className="size-4" />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-semibold">
                {space ? space.name : t("spaceSwitcher.personal.text")}
              </span>
              <span className="truncate text-[11px] leading-[15px] text-ardoise">
                {space ? space.role : t("spaceSwitcher.personal.hint")}
              </span>
            </span>
            {active && <Icon name="check" className="size-4 shrink-0 text-feuille-fonce" />}
          </button>
        </form>
      </li>
    );
  };
  return (
    <details className="relative">
      <summary
        aria-label={t("spaceSwitcher.aria")}
        className={cx(
          "flex h-10 max-w-[13rem] cursor-pointer list-none items-center gap-2 rounded-pill pr-3.5 pl-[5px] text-[13px] font-semibold [&::-webkit-details-marker]:hidden",
          tone === "dark" ? "bg-blanc/10 text-blanc" : "bg-blanc text-sapin",
        )}
      >
        {current ? (
          <CompanyLogo name={current.name} size="sm" />
        ) : (
          <span
            className={cx(
              "flex size-[30px] shrink-0 items-center justify-center rounded-full",
              tone === "dark" ? "bg-blanc/15" : "bg-creme",
            )}
          >
            <Icon name="profil" className="size-4" />
          </span>
        )}
        <span className="truncate">
          {current ? current.name : t("spaceSwitcher.personal.text")}
        </span>
        <Icon name="chev-d" className="size-4 shrink-0 opacity-70" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-box bg-blanc p-2.5 text-sapin shadow-menu">
        <p className="px-3 pt-2 pb-2 text-lab text-ardoise">{t("spaceSwitcher.label")}</p>
        <ul className="flex flex-col gap-1">
          {option(null)}
          <li className="px-3 pt-3 pb-1.5 text-lab text-ardoise">
            {t("spaceSwitcher.sectionOrgs")}
          </li>
          {spaces.map(option)}
        </ul>
      </div>
    </details>
  );
}
