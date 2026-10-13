import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import { Field, inputClasses, type FieldProps } from "./field";

type Option = { value: string; label: string };

type Props = FieldProps &
  Omit<ComponentProps<"select">, "id" | "required"> & {
    options: Option[];
    /** Text of the empty first option, shown while nothing is chosen. */
    placeholder?: string;
  };

export function Select({
  id,
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  className,
  ...rest
}: Props) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(aria) => (
        <div className="relative">
          <select
            className={cx(inputClasses, "h-11 appearance-none pr-10", className)}
            {...aria}
            {...rest}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ardoise"
          />
        </div>
      )}
    </Field>
  );
}
