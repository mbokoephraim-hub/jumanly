import type { ComponentProps } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { Field, inputClasses, type FieldProps } from "./field";

type Props = FieldProps & Omit<ComponentProps<"input">, "id" | "required"> & { icon?: IconName };

export function TextField({ id, label, hint, error, required, className, icon, ...rest }: Props) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(aria) =>
        icon ? (
          <div className="relative">
            <Icon
              name={icon}
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ardoise"
            />
            <input className={cx(inputClasses, "h-12 pl-11", className)} {...aria} {...rest} />
          </div>
        ) : (
          <input className={cx(inputClasses, "h-12", className)} {...aria} {...rest} />
        )
      }
    </Field>
  );
}
