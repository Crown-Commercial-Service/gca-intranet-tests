import { expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeAxeHtmlReport, mergeAxeResults } from "./axeReport";
import { runA11yScan } from "./axe";

type AxeViolation = {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
};

type AxeResults = {
  violations: AxeViolation[];
};

function getCriticalViolations(results: AxeResults): AxeViolation[] {
  return results.violations.filter(
    (violation) => violation.impact === "critical",
  );
}

function getSeriousViolations(results: AxeResults): AxeViolation[] {
  return results.violations.filter(
    (violation) => violation.impact === "serious",
  );
}

export async function expectNoSeriousA11yViolations(
  page: Page,
  label: string = "full-page",
) {
  const results = (await runA11yScan(page)) as AxeResults;

  const critical = getCriticalViolations(results);
  const serious = getSeriousViolations(results);

  expect(critical).toHaveLength(0);
  expect(serious).toHaveLength(0);
}

async function expectNoSeriousA11yViolationsForSelector(
  page: Page,
  selector: string,
) {
  const locator = page.locator(selector);
  const count = await locator.count();

  expect(count, `A11y selector not found on page: ${selector}`).toBeGreaterThan(
    0,
  );

  const results = (await new AxeBuilder({ page })
    .include(selector)
    .analyze()) as AxeResults;

  const critical = getCriticalViolations(results);
  const serious = getSeriousViolations(results);

  expect(critical).toHaveLength(0);
  expect(serious).toHaveLength(0);

  return results;
}

export async function expectNoSeriousA11yViolationsForSelectors(
  page: Page,
  selectors: string[],
  label: string = "a11y-sections",
) {
  const results = [];

  for (const selector of selectors) {
    const result = await expectNoSeriousA11yViolationsForSelector(
      page,
      selector,
    );
    results.push(result);
  }

  const merged = mergeAxeResults(results as any, page.url());

  writeAxeHtmlReport(merged as any, {
    fileName: `${label}.html`,
    projectKey: label,
    customSummary: `Accessibility scan for selectors: ${selectors.join(", ")}`,
  });
}

export async function expectNoSeriousA11yViolationsForPaths(
  page: Page,
  paths: string[],
) {
  for (const path of paths) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expectNoSeriousA11yViolations(page, `path-${path}`);
  }
}
