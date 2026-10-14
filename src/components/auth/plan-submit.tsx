"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/brand/icon";
import { buttonClasses } from "@/components/ui/button";

/** « Continuer avec Pro · 19,9 USD/mois »: the label follows the plan chosen above it. */
export function PlanSubmit({
  labels,
  selected,
  fallback,
}: {
  labels: Record<string, string>;
  selected?: string;
  fallback: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [plan, setPlan] = useState(selected);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const update = () => setPlan(new FormData(form).get("forfait")?.toString());
    form.addEventListener("change", update);
    return () => form.removeEventListener("change", update);
  }, []);
  return (
    <button ref={ref} type="submit" className={buttonClasses({ size: "lg", fullWidth: true })}>
      {(plan && labels[plan]) || fallback}
      <Icon name="chev-r" className="size-5" />
    </button>
  );
}
