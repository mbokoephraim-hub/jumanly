import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type Props = Omit<ComponentProps<"input">, "type"> & {
  id: string;
  label: string;
  hint?: string;
  /** `radio` for a single choice within a group. */
  type?: "checkbox" | "radio";
};

/** Checkbox or radio button with its label. */
export function Checkbox({ id, label, hint, type = "checkbox", className, ...rest }: Props) {
  return (
    <div className={cx("flex items-start gap-3", className)}>
      <input
        id={id}
        type={type}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-sapin disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer text-[15px] leading-6 text-sapin">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-ardoise text-caption">
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
      <legend className="mb-2 text-sapin text-label">{legend}</legend>
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
