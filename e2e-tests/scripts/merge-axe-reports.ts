import fs from "fs";
import path from "path";
import type { AxeResults } from "axe-core";
import { createHtmlReport } from "axe-html-reporter";

const OUTPUT_DIR = "test-results/axe";
const OUTPUT_FILE = "index.html";

function readAxeJsonFiles(dir: string): AxeResults[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Axe output directory does not exist: ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter(
      (file) =>
        file.endsWith(".json") &&
        file !== "index.json" &&
        !file.startsWith("."),
    )
    .sort();

  if (files.length === 0) {
    throw new Error(`No axe JSON files found in: ${dir}`);
  }

  return files.map((file) => {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw) as AxeResults;
  });
}

function mergeAxeResults(resultsList: AxeResults[]): AxeResults {
  if (resultsList.length === 0) {
    throw new Error("No axe results supplied to merge.");
  }

  const first = resultsList[0];

  return {
    ...first,
    url: "Consolidated accessibility report",
    timestamp: new Date().toISOString(),
    violations: resultsList.flatMap((result) => result.violations ?? []),
    passes: resultsList.flatMap((result) => result.passes ?? []),
    incomplete: resultsList.flatMap((result) => result.incomplete ?? []),
    inapplicable: resultsList.flatMap((result) => result.inapplicable ?? []),
  };
}

function writeMergedReport(results: AxeResults, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "index.json"),
    JSON.stringify(results, null, 2),
  );

  createHtmlReport({
    results,
    options: {
      projectKey: "gca-intranet-a11y",
      customSummary: "Consolidated accessibility report for all a11y test runs",
      outputDir,
      reportFileName: OUTPUT_FILE,
    },
  });
}

function main(): void {
  const results = readAxeJsonFiles(OUTPUT_DIR);
  const merged = mergeAxeResults(results);
  writeMergedReport(merged, OUTPUT_DIR);

  console.log(
    `Merged axe report written to ${path.join(OUTPUT_DIR, OUTPUT_FILE)}`,
  );
}

main();
