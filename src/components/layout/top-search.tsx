import { Icon } from "@/components/brand/icon";
import { SlashFocus } from "./slash-focus";

/**
 * Wide rounded search of the top bar (Admin v4, étape 3, inspired by Patreon): always at the same
 * place, a GET form that works without JavaScript; « / » puts the cursor in it.
 */
export function TopSearch({
  id,
  action,
  label,
  placeholder,
  shortcut,
}: {
  id: string;
  action: string;
  label: string;
  placeholder: string;
  /** Read by screen readers: « Raccourci : / ». */
  shortcut: string;
}) {
  return (
    <form action={action} role="search" className="relative w-full max-w-[420px]">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon
        name="recherche"
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
      />
      <input
        id={id}
        name="q"
        type="search"
        placeholder={placeholder}
        aria-describedby={`${id}-shortcut`}
        className="h-11 w-full rounded-pill bg-blanc pr-12 pl-11 text-[13.5px] text-sapin shadow-[0_1px_2px_rgb(11_26_31/0.05)] ring-1 ring-sapin/10 ring-inset placeholder:text-ardoise focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:outline-none"
      />
      <kbd
        id={`${id}-shortcut`}
        aria-label={shortcut}
        className="absolute top-1/2 right-3.5 hidden h-6 -translate-y-1/2 items-center rounded-[7px] bg-creme px-2 font-sans text-[12px] font-semibold text-ardoise ring-1 ring-sapin/10 sm:flex"
      >
        /
      </kbd>
      <SlashFocus target={id} />
    </form>
  );
}
