import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/fr.json";

/** Renders a component with the real French texts. */
export function renderWithTexts(element: ReactElement) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages} timeZone="UTC">
      {element}
    </NextIntlClientProvider>,
  );
}
