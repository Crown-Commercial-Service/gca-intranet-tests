import fs from "fs";
import path from "path";
import type { AxeResults } from "axe-core";
import { createHtmlReport } from "axe-html-reporter";

type ReportOpts = {
  fileName: string;
  outputDir?: string;
  projectKey?: string;
  customSummary?: string;
};

export function writeAxeHtmlReport(
  results: AxeResults,
  opts: ReportOpts,
): void {
  const outputDir = (opts.outputDir ?? "test-results/axe").trim();

  fs.mkdirSync(outputDir, { recursive: true });

  createHtmlReport({
    results,
    options: {
      projectKey: opts.projectKey ?? "a11y",
      customSummary: opts.customSummary,
      outputDir,
      reportFileName: opts.fileName,
    },
  });
}

export function mergeAxeResults(
  resultsList: AxeResults[],
  pageUrl = "",
): AxeResults {
  if (resultsList.length === 0) {
    throw new Error("No axe results supplied to merge.");
  }

  const first = resultsList[0];

  return {
    ...first,
    url: pageUrl || first.url,
    timestamp: new Date().toISOString(),
    violations: resultsList.flatMap((r) => r.violations),
    passes: resultsList.flatMap((r) => r.passes),
    incomplete: resultsList.flatMap((r) => r.incomplete),
    inapplicable: resultsList.flatMap((r) => r.inapplicable),
  };
}

export function getLatestAxeReportPath(
  outputDir = "test-results/axe",
): string | null {
  if (!fs.existsSync(outputDir)) return null;

  const htmlFiles = fs
    .readdirSync(outputDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => ({
      file,
      fullPath: path.join(outputDir, file),
      mtimeMs: fs.statSync(path.join(outputDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return htmlFiles[0]?.fullPath ?? null;
}
