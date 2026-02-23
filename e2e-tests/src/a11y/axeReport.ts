import type { AxeResults } from "axe-core";
import { createHtmlReport } from "axe-html-reporter";
import fs from "fs";
import path from "path";

type ReportOpts = {
  fileName: string;
  outputDir?: string;
  projectKey?: string;
};

export function writeAxeHtmlReport(
  results: AxeResults,
  opts: ReportOpts,
): void {
  const outputDir =
    opts.outputDir ?? path.resolve(process.cwd(), "test-results/axe");

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
