import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/fr.json";

/** Rendu d'un composant avec les vrais textes français. */
export function rendre(element: ReactElement) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages} timeZone="UTC">
      {element}
    </NextIntlClientProvider>,
  );
}
