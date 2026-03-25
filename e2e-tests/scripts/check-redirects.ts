import { request } from "@playwright/test";
import fs from "fs";
import path from "path";
import logger from "../../e2e-tests/src/utils/logger";
import { urlRedirects } from "../tests/data/url_redirects_uat";

/**
 * Normalise URLs by removing trailing slashes
 * so `/page` and `/page/` are treated the same.
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "") || "/";
}

/**
 * Shape of a failed redirect record (for CSV export)
 */
type Failure = {
  before: string;
  expected: string;
  actual: string;
  status: number | string;
  reason: string;
};

async function run(): Promise<void> {
  const startTime = Date.now(); // ⏱ Track total execution time

  /**
   * Create a lightweight HTTP client (no browser needed)
   */
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failedCount = 0;
  const failures: Failure[] = [];

  try {
    /**
     * Loop through each redirect pair:
     * - `before` = URL that should redirect
     * - `after`  = expected destination
     */
    for (const { before, after } of urlRedirects) {
      try {
        /**
         * Make request
         * Playwright automatically follows redirects
         */
        const response = await api.get(before, {
          timeout: 15000,
        });

        const status = response.status(); // final HTTP status
        const actualUrl = response.url(); // final resolved URL
        const expectedUrl = new URL(after, before).toString();

        // Normalise URLs to avoid false failures (e.g. trailing slash differences)
        const normalizedBefore = normalizeUrl(before);
        const normalizedActual = normalizeUrl(actualUrl);
        const normalizedExpected = normalizeUrl(expectedUrl);

        /**
         * 1. Final response must be 200
         */
        if (status !== 200) {
          logger.error(`FAIL ${status} ${before}`);
          failures.push({
            before,
            expected: expectedUrl,
            actual: actualUrl,
            status,
            reason: "Non-200 response",
          });
          failedCount++;
          continue;
        }

        /**
         * 2. Final URL must match expected redirect target
         */
        if (normalizedActual !== normalizedExpected) {
          logger.error(`FAIL REDIRECT MISMATCH ${before}`);
          failures.push({
            before,
            expected: expectedUrl,
            actual: actualUrl,
            status,
            reason: "Redirect mismatch",
          });
          failedCount++;
          continue;
        }

        /**
         * 3. Ensure a redirect actually happened
         * (i.e. we didn’t just land on the same URL)
         */
        if (normalizedBefore === normalizedActual) {
          logger.error(`FAIL NO REDIRECT ${before}`);
          failures.push({
            before,
            expected: expectedUrl,
            actual: actualUrl,
            status,
            reason: "No redirect occurred",
          });
          failedCount++;
          continue;
        }

        /**
         * All checks passed
         */
        logger.info(`PASS ${before} -> ${actualUrl}`);
      } catch (error) {
        logger.error(`ERROR ${before}`);

        failures.push({
          before,
          expected: after,
          actual: "",
          status: "ERROR",
          reason: error instanceof Error ? error.message : "Unknown error",
        });

        failedCount++;
      }
    }

    /**
     * Export failures to CSV for easy analysis (Excel, sharing, etc.)
     */
    if (failures.length > 0) {
      const filePath = path.resolve(process.cwd(), "redirect_failures.csv");

      const header = "before,expected,actual,status,reason\n";

      const rows = failures
        .map(
          (f) =>
            `"${f.before}","${f.expected}","${f.actual}","${f.status}","${f.reason}"`,
        )
        .join("\n");

      fs.writeFileSync(filePath, header + rows);

      logger.info(`CSV report created: ${filePath}`);
    }

    /**
     * Calculate total execution time
     */
    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    /**
     * Summary output
     */
    logger.info("Done");
    logger.info(`Total checked: ${urlRedirects.length}`);
    logger.info(`Failed: ${failedCount}`);
    logger.info(`Duration: ${durationSec}s`);

    /**
     * Fail CI if any redirects failed
     */
    if (failedCount > 0) {
      throw new Error(`${failedCount} redirect check(s) failed`);
    }
  } finally {
    /**
     * Always clean up the API context
     */
    await api.dispose();
  }
}

/**
 * Ensure process exits correctly for CI pipelines
 */
run().catch((error) => {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error("Redirect check failed");
  }

  process.exit(1);
});
