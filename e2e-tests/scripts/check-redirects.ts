import { request } from "@playwright/test";
import logger from "../../e2e-tests/src/utils/logger";
import { urlRedirects } from "../../e2e-tests/tests/data/url_redirect";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "") || "/";
}

async function run(): Promise<void> {
  // Create a lightweight HTTP client for the redirect checks.
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failedCount = 0;

  try {
    // Check each redirect pair:
    // - "before" should resolve successfully
    // - final URL should match "after"
    for (const { before, after } of urlRedirects) {
      try {
        const response = await api.get(before, { timeout: 15000 });
        const status = response.status();
        const actualUrl = response.url();
        const expectedUrl = new URL(after, before).toString();

        // A valid redirect chain should end in a 200 response.
        if (status !== 200) {
          logger.error(`FAIL ${status} ${before}`);
          logger.error(`Expected: ${expectedUrl}`);
          logger.error(`Actual:   ${actualUrl}`);
          failedCount++;
          continue;
        }

        // Compare normalised URLs so trailing slashes do not cause false failures.
        if (normalizeUrl(actualUrl) !== normalizeUrl(expectedUrl)) {
          logger.error(`FAIL REDIRECT MISMATCH ${before}`);
          logger.error(`Expected: ${expectedUrl}`);
          logger.error(`Actual:   ${actualUrl}`);
          failedCount++;
          continue;
        }

        logger.info(`PASS ${before} -> ${actualUrl}`);
      } catch (error) {
        logger.error(`ERROR ${before}`);

        if (error instanceof Error) {
          logger.error(error.message);
        }

        failedCount++;
      }
    }

    logger.info("Done");
    logger.info(`Total checked: ${urlRedirects.length}`);
    logger.info(`Failed: ${failedCount}`);

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

  throw error;
});
