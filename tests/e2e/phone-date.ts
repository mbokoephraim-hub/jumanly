import { expect, type Locator } from "@playwright/test";

/**
 * Picks a date in a Jumanly calendar field (PhoneDateField, #356): opens the sheet, goes to the
 * month with « Mois suivant », clicks the day, then « Confirmer ». `iso` is yyyy-mm-dd, in the
 * coming months.
 */
export async function pickPhoneDate(scope: Locator, label: string, iso: string) {
  const page = scope.page();
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await scope.getByRole("button", { name: new RegExp(`^${escaped} · `) }).click();
  const sheet = page.getByRole("dialog", { name: label, exact: true });
  await expect(sheet).toBeVisible();
  const date = new Date(`${iso}T12:00:00Z`);
  const month = new Intl.DateTimeFormat("fr", { month: "long", timeZone: "UTC" }).format(date);
  // « mardi 1 décembre 2026 », as the day buttons are named.
  const name = new RegExp(` ${date.getUTCDate()} ${month} ${date.getUTCFullYear()}$`);
  const day = sheet.locator(".nb-cal-jour:not([data-autre])").filter({ visible: true });
  for (let turn = 0; turn < 24; turn++) {
    const target = day.and(page.getByRole("button", { name }));
    if ((await target.count()) > 0) {
      await target.click();
      break;
    }
    await sheet.getByRole("button", { name: "Mois suivant" }).click();
  }
  await sheet.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect(sheet).toBeHidden();
}
