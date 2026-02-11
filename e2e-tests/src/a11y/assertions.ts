import { expect, Page } from "@playwright/test";
import { runA11yScan } from "./axe";

export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await runA11yScan(page);

  const violations = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );

  if (violations.length) {
    console.log("Accessibility violations found:\n");
    for (const v of violations) {
      console.log(`${v.impact?.toUpperCase()} — ${v.id}`);
      console.log(v.help);
      console.log(v.helpUrl);
      console.log("---");
    }
  }

  expect(violations).toEqual([]);
}

export async function expectNoSeriousA11yViolationsForPaths(
  page: Page,
  paths: string[],
) {
  for (const path of paths) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expectNoSeriousA11yViolations(page);
  }
}
