import { Fragment, type ReactNode } from "react";

/** Marker to pass as a text value, replaced afterwards by `interpolate` (links inside a text). */
export const slot = (name: string) => `\u0001${name}\u0001`;

/** Replaces the `slot(name)` markers of a translated text with React nodes. */
export function interpolate(text: string, nodes: Record<string, ReactNode>): ReactNode {
  return text
    .split("\u0001")
    .map((part, index) => (
      <Fragment key={index}>{index % 2 === 1 ? (nodes[part] ?? null) : part}</Fragment>
    ));
}
