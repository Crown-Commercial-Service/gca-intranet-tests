import { request } from "@playwright/test";
import { urls } from "../../e2e-tests/tests/data/urls";

async function run() {
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failed = 0;

  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await api.get(url, {
          timeout: 15000,
        });

        const status = res.status();
        const finalUrl = res.url();

        const isBadRedirect =
          finalUrl.includes("/login") ||
          finalUrl.includes("/signin") ||
          finalUrl.includes("/auth") ||
          finalUrl === "https://qa.intranet.gca.gov.uk/";

        const isExternalRedirect = !finalUrl.includes("qa.intranet.gca.gov.uk");

        if (status !== 200) {
          console.log(`FAIL  ${status}  ${url}`);
          failed++;
        } else if (isBadRedirect) {
          console.log(`BAD REDIRECT  ${url} -> ${finalUrl}`);
          failed++;
        } else if (isExternalRedirect) {
          console.log(`EXTERNAL REDIRECT  ${url} -> ${finalUrl}`);
          failed++;
        } else {
          console.log(`PASS  ${status}  ${url}`);
        }
      } catch {
        console.log(`ERROR ${url}`);
        failed++;
      }
    }),
  );

  console.log("\nDone");
  console.log(`Total: ${urls.length}`);
  console.log(`Failed: ${failed}`);

  await api.dispose();

  if (failed > 0) {
    process.exit(1);
  }
}

run();
