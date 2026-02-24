import { expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { runA11yScan } from "./axe";
import { writeAxeHtmlReport } from "./axeReport";

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

  writeAxeHtmlReport(results as any, {
    fileName: `${label}.html`,
    projectKey: label,
    customSummary: `Accessibility scan for: ${label}`,
  });

  const critical = getCriticalViolations(results);
  const serious = getSeriousViolations(results);

  expect(critical).toHaveLength(0);
  expect(serious).toHaveLength(0);
}

export async function expectNoSeriousA11yViolationsForSelector(
  page: Page,
  selector: string,
  label: string,
) {
  const results = (await new AxeBuilder({ page })
    .include(selector)
    .analyze()) as AxeResults;

  writeAxeHtmlReport(results as any, {
    fileName: `${label}.html`,
    projectKey: label,
    customSummary: `Accessibility scan for section: ${selector}`,
  });

  const critical = getCriticalViolations(results);
  const serious = getSeriousViolations(results);

  expect(critical).toHaveLength(0);
  expect(serious).toHaveLength(0);
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
