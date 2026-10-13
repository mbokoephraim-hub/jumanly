import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { Field, inputClasses, type FieldProps } from "./field";

type Props = FieldProps & Omit<ComponentProps<"input">, "id" | "required">;

export function TextField({ id, label, hint, error, required, className, ...rest }: Props) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(aria) => <input className={cx(inputClasses, "h-11", className)} {...aria} {...rest} />}
    </Field>
  );
}
