import { useTranslations } from "next-intl";
import { switchSpace } from "@/server/actions/hire";
import { cx } from "@/lib/cx";

export type SpaceOption = { id: string; name: string; role: string };

/**
 * Space switcher (textes `spaceSwitcher.*`): Personnel, then each organization. A native
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
              "flex w-full flex-col rounded-sm px-3 py-2 text-left hover:bg-creme",
              active && "bg-menthe-claire",
            )}
          >
            <span className="font-medium">
              {space ? space.name : t("spaceSwitcher.personal.text")}
            </span>
            <span className="text-ardoise text-caption">
              {space ? space.role : t("spaceSwitcher.personal.hint")}
            </span>
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
          "flex h-11 max-w-[11rem] cursor-pointer list-none items-center gap-2 truncate rounded-pill px-4 text-sm font-medium [&::-webkit-details-marker]:hidden",
          tone === "dark" ? "bg-blanc/10 text-blanc" : "bg-blanc text-sapin",
        )}
      >
        <span className="truncate">
          {current ? current.name : t("spaceSwitcher.personal.text")}
        </span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-72 rounded-md border border-brume bg-blanc p-2 text-sapin shadow-lg">
        <p className="px-3 pt-1 pb-2 text-ardoise text-caption">{t("spaceSwitcher.label")}</p>
        <ul className="flex flex-col gap-1">
          {option(null)}
          <li className="px-3 pt-2 text-ardoise text-caption">{t("spaceSwitcher.sectionOrgs")}</li>
          {spaces.map(option)}
        </ul>
      </div>
    </details>
  );
}
