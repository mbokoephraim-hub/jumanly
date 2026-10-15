import { Icon } from "@/components/brand/icon";
import { adminLabel } from "./kit";

/**
 * « Points à contrôler » (mockup 07-07): a memo for the moderator, ticked by hand. Nothing is
 * saved; the list starts empty for each job (`resetKey`).
 */
export function OffresChecklist({
  title,
  items,
  resetKey,
}: {
  title: string;
  items: { id: string; label: string }[];
  resetKey: string;
}) {
  return (
    <fieldset key={resetKey} className="flex flex-col gap-2.5">
      <legend className={`${adminLabel} mb-2.5`}>{title}</legend>
      {items.map((item) => {
        const id = `offres-check-${item.id}`;
        return (
          <div key={item.id} className="flex items-start gap-2.5 text-[13px] leading-[19px]">
            <span className="relative mt-px grid size-5 shrink-0">
              <input
                id={id}
                type="checkbox"
                className="peer size-5 cursor-pointer appearance-none rounded-[6px] bg-blanc ring-[1.5px] ring-[#8a9794] ring-inset checked:bg-sapin checked:ring-0 focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none"
              />
              <Icon
                name="check"
                aria-hidden
                className="pointer-events-none absolute inset-0.5 hidden size-4 text-lime peer-checked:block"
              />
            </span>
            <label htmlFor={id} className="cursor-pointer">
              {item.label}
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
