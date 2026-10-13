"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

/** Fenêtre modale basée sur l'élément natif <dialog> (focus et Échap gérés par le navigateur). */
export function Modale({
  ouverte,
  onFermer,
  titre,
  children,
  actions,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const t = useTranslations("composants");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogue = ref.current;
    if (!dialogue) return;
    if (ouverte && !dialogue.open) dialogue.showModal();
    if (!ouverte && dialogue.open) dialogue.close();
  }, [ouverte]);

  return (
    <dialog
      ref={ref}
      onClose={onFermer}
      aria-labelledby="modale-titre"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-carte bg-blanc p-0 text-sapin shadow-carte backdrop:bg-nuit/50"
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-2">
        <h2 id="modale-titre" className="text-h2 font-medium">
          {titre}
        </h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label={t("fermer")}
          className="rounded-full p-2 text-ardoise hover:bg-sapin/8 hover:text-sapin"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="px-6 pb-6 text-[15px] leading-6 text-ardoise">{children}</div>
      {actions && (
        <div className="flex flex-col-reverse gap-3 border-t border-brume px-6 py-4 sm:flex-row sm:justify-end">
          {actions}
        </div>
      )}
    </dialog>
  );
}
