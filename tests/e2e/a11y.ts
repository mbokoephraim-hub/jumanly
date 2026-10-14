import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** WCAG 2.2 AA (CLAUDE.md § 10): no automatic violation on the current page. */
export async function expectAccessible(page: Page) {
  // Motion is decorative (src/styles/motion.css): check the resting state, not elements caught
  // halfway through a fade, whose blended colors would fail the contrast rule at random.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} : ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(" ")).join("\n  ")}`,
  );
  expect(summary, page.url()).toEqual([]);
}
