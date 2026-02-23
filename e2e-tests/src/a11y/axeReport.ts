import fs from "fs";
import path from "path";
import type { AxeResults } from "axe-core";
import { createHtmlReport } from "axe-html-reporter";

type ReportOpts = {
  fileName: string;
  outputDir?: string;
  projectKey?: string;
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
      outputDir,
      reportFileName: opts.fileName,
    },
  });
}
