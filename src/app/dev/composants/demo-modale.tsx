"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bouton, Modale } from "@/components/ui";

export function DemoModale() {
  const t = useTranslations("devComposants.modale");
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <Bouton variante="contour" onClick={() => setOuverte(true)}>
        {t("ouvrir")}
      </Bouton>
      <Modale
        ouverte={ouverte}
        onFermer={() => setOuverte(false)}
        titre={t("titre")}
        actions={
          <>
            <Bouton variante="fantome" onClick={() => setOuverte(false)}>
              {t("annuler")}
            </Bouton>
            <Bouton onClick={() => setOuverte(false)}>{t("confirmer")}</Bouton>
          </>
        }
      >
        {t("texte")}
      </Modale>
    </>
  );
}
