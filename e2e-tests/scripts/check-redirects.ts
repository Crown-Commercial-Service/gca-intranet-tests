import { request } from "@playwright/test";
import fs from "fs";
import path from "path";
import logger from "../../e2e-tests/src/utils/logger";
import { urlRedirects } from "../../e2e-tests/tests/data/url_redirects_prod";

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

type RedirectPair = {
  before: string;
  after: string;
};

/**
 * How many redirect checks to run at once.
 * 5 or 10 is usually a good balance.
 */
const CONCURRENCY = 10;

async function run(): Promise<void> {
  const startTime = Date.now();

  /**
   * Create a lightweight HTTP client (no browser needed)
   */
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failedCount = 0;
  const failures: Failure[] = [];

  /**
   * Shared index for worker pool
   */
  let currentIndex = 0;

  /**
   * Run a single redirect check
   */
  async function checkRedirect({ before, after }: RedirectPair): Promise<void> {
    try {
      /**
       * Make request
       * Playwright automatically follows redirects
       */
      const response = await api.get(before, {
        timeout: 15000,
      });

      const status = response.status();
      const actualUrl = response.url();
      const expectedUrl = new URL(after, before).toString();

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
        return;
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
        return;
      }

      /**
       * 3. If before and after are the same URL, no redirect happened.
       * That is not a failure in this version.
       */
      if (normalizedBefore === normalizedActual) {
        logger.info(`PASS NO REDIRECT ${before}`);
        return;
      }

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
   * Worker: keep taking the next URL until none remain
   */
  async function worker(): Promise<void> {
    while (true) {
      const index = currentIndex++;
      const redirect = urlRedirects[index];

      if (!redirect) {
        return;
      }

      await checkRedirect(redirect);
    }
  }

  try {
    /**
     * Start a small pool of workers
     */
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => worker()),
    );

    /**
     * Export failures to CSV for easy analysis
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

    logger.info("Done");
    logger.info(`Total checked: ${urlRedirects.length}`);
    logger.info(`Failed: ${failedCount}`);
    logger.info(`Duration: ${durationSec}s`);
    logger.info(`Concurrency: ${CONCURRENCY}`);

    if (failedCount > 0) {
      throw new Error(`${failedCount} redirect check(s) failed`);
    }
  } finally {
    await api.dispose();
  }
}

run().catch((error) => {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error("Redirect check failed");
  }

  process.exit(1);
});
