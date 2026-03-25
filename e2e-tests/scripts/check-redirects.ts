import { request } from "@playwright/test";
import logger from "../../e2e-tests/src/utils/logger";
import { urlRedirects } from "../../e2e-tests/tests/data/url_redirect";

/**
 * Normalise URLs by removing trailing slashes
 * so `/page` and `/page/` are treated the same.
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "") || "/";
}

async function run(): Promise<void> {
  // Create a lightweight HTTP client (no browser needed)
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failedCount = 0;

  try {
    /**
     * Loop through each redirect pair:
     * - `before` = URL that should redirect
     * - `after`  = expected final destination
     */
    for (const { before, after } of urlRedirects) {
      try {
        // Make request (Playwright will follow redirects automatically)
        const response = await api.get(before, {
          timeout: 15000,
        });

        const status = response.status(); // final HTTP status
        const actualUrl = response.url(); // final resolved URL
        const expectedUrl = new URL(after, before).toString();

        // Normalise all URLs to avoid false failures (trailing slashes etc.)
        const normalizedBefore = normalizeUrl(before);
        const normalizedActual = normalizeUrl(actualUrl);
        const normalizedExpected = normalizeUrl(expectedUrl);

        /**
         * 1. Final response must be 200
         */
        if (status !== 200) {
          logger.error(`FAIL ${status} ${before}`);
          logger.error(`Expected: ${expectedUrl}`);
          logger.error(`Actual:   ${actualUrl}`);
          failedCount++;
          continue;
        }

        /**
         * 2. Final URL must match expected redirect target
         */
        if (normalizedActual !== normalizedExpected) {
          logger.error(`FAIL REDIRECT MISMATCH ${before}`);
          logger.error(`Expected: ${expectedUrl}`);
          logger.error(`Actual:   ${actualUrl}`);
          failedCount++;
          continue;
        }

        /**
         * 3. Ensure a redirect actually happened
         * (i.e. we didn’t just land on the same URL)
         */
        if (normalizedBefore === normalizedActual) {
          logger.error(`FAIL NO REDIRECT ${before}`);
          logger.error(`Expected redirect to: ${expectedUrl}`);
          logger.error(`Actual final URL:     ${actualUrl}`);
          failedCount++;
          continue;
        }

        // All checks passed
        logger.info(`PASS ${before} -> ${actualUrl}`);
      } catch (error) {
        logger.error(`ERROR ${before}`);

        if (error instanceof Error) {
          logger.error(error.message);
        }

        failedCount++;
      }
    }

    // Summary
    logger.info("Done");
    logger.info(`Total checked: ${urlRedirects.length}`);
    logger.info(`Failed: ${failedCount}`);

    // Fail CI if any redirects failed
    if (failedCount > 0) {
      throw new Error(`${failedCount} redirect check(s) failed`);
    }
  } finally {
    await api.dispose();
  }
}

// Ensure process exits correctly for CI pipelines
run().catch((error) => {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error("Redirect check failed");
  }

  process.exit(1);
});
