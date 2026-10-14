import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { Field, inputClasses, type FieldProps } from "./field";

type Props = FieldProps & Omit<ComponentProps<"textarea">, "id" | "required">;

export function TextArea({ id, label, hint, error, required, className, ...rest }: Props) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(aria) => (
        <textarea
          rows={4}
          className={cx(inputClasses, "min-h-24 py-3.5", className)}
          {...aria}
          {...rest}
        />
      )}
    </Field>
  );
}
