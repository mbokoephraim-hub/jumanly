import type { ComponentProps } from "react";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

type Props = Omit<ComponentProps<"input">, "type"> & {
  id: string;
  label: string;
  hint?: string;
  /** `radio` for a single choice within a group. */
  type?: "checkbox" | "radio";
};

// Mockup 00-02: 20 px box (radius 6) or disc, grey outline; checked in Sapin with a white mark.
/** Checkbox or radio button with its label. */
export function Checkbox({ id, label, hint, type = "checkbox", className, ...rest }: Props) {
  return (
    <div className={cx("flex items-start gap-2.5", className)}>
      <span className="relative mt-px flex size-5 shrink-0">
        <input
          id={id}
          type={type}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cx(
            "peer size-5 cursor-pointer appearance-none bg-blanc ring-[1.5px] ring-[#8a9794] ring-inset",
            "checked:bg-sapin checked:ring-sapin disabled:cursor-not-allowed disabled:opacity-50",
            type === "radio" ? "rounded-full" : "rounded-[6px]",
          )}
          {...rest}
        />
        {type === "radio" ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[6px] hidden rounded-full bg-blanc peer-checked:block"
          />
        ) : (
          <Icon
            name="check"
            className="pointer-events-none absolute inset-0.5 hidden size-4 text-blanc peer-checked:block"
          />
        )}
      </span>
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer text-sm leading-5 text-sapin">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-xs leading-[17px] text-ardoise">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

/** Group of radio buttons sharing one legend. */
export function RadioGroup({
  legend,
  name,
  options,
  defaultValue,
  required = false,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string; hint?: string; disabled?: boolean }[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-[13px] leading-[18px] font-semibold text-sapin">{legend}</legend>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          id={`${name}-${option.value}`}
          type="radio"
          name={name}
          value={option.value}
          label={option.label}
          hint={option.hint}
          disabled={option.disabled}
          defaultChecked={option.value === defaultValue}
          required={required}
        />
      ))}
    </fieldset>
  );
}
