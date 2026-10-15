import { test as base } from "@playwright/test";
import { skipIntro } from "./session";

export * from "@playwright/test";

/** Every journey skips the welcome intro when it shows (see `skipIntro`). */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await skipIntro(page);
    await provide(page);
  },
});
