import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// WCAG 2.2 AA (CLAUDE.md § 10): automatic checks on every page of the foundation.
for (const path of ["/", "/app", "/dev/composants"]) {
  test(`aucune erreur d'accessibilité WCAG 2.2 AA sur ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const summary = results.violations.map(
      (violation) =>
        `${violation.id} : ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(" ")).join("\n  ")}`,
    );
    expect(summary).toEqual([]);
  });
}
