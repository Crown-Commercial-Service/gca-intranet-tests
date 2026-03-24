import { request } from "@playwright/test";
import logger from "../../e2e-tests/src/utils/logger";
import { urls } from "../../e2e-tests/tests/data/urls";

async function run(): Promise<void> {
  // Create HTTP client for checking URLs
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failedCount = 0;

  try {
    // Run checks in parallel for speed
    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await api.get(url, { timeout: 15000 });

          const status = response.status();
          const finalUrl = response.url();

          // Detect unwanted redirects (auth pages or homepage fallback)
          const isBadRedirect =
            finalUrl.includes("/login") ||
            finalUrl.includes("/signin") ||
            finalUrl.includes("/auth") ||
            finalUrl === "https://qa.intranet.gca.gov.uk/";

          // Detect redirects outside expected domain
          const isExternalRedirect = !finalUrl.includes(
            "qa.intranet.gca.gov.uk",
          );

          if (status !== 200) {
            logger.error(`FAIL ${status} ${url}`);
            failedCount++;
            return;
          }

          if (isBadRedirect) {
            logger.error(`BAD REDIRECT ${url} -> ${finalUrl}`);
            failedCount++;
            return;
          }

          if (isExternalRedirect) {
            logger.error(`EXTERNAL REDIRECT ${url} -> ${finalUrl}`);
            failedCount++;
            return;
          }

          logger.info(`PASS ${url}`);
        } catch (error) {
          logger.error(`ERROR ${url}`);

          if (error instanceof Error) {
            logger.error(error.message);
          }

          failedCount++;
        }
      }),
    );

    logger.info("Done");
    logger.info(`Total checked: ${urls.length}`);
    logger.info(`Failed: ${failedCount}`);

    if (failedCount > 0) {
      throw new Error(`${failedCount} URL check(s) failed`);
    }
  } finally {
    await api.dispose();
  }
}

run().catch((error) => {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error("URL check failed");
  }

  throw error;
});
