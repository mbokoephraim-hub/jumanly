import { clsx, type ClassValue } from "clsx";

/** Assemble des classes CSS conditionnelles. */
export function cx(...classes: ClassValue[]) {
  return clsx(classes);
}
