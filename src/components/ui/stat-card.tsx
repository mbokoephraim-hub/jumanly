import type { ReactNode } from "react";
import { Card, type CardTone } from "./card";

/** Key figure: label, value, optional hint or trend. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: CardTone;
}) {
  return (
    <Card tone={tone} className="flex flex-col gap-2 p-5">
      <p className="text-eyebrow">{label}</p>
      <p className="text-h1">{value}</p>
      {hint && <div className="text-sm">{hint}</div>}
    </Card>
  );
}
