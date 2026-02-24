import fs from "fs";
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
