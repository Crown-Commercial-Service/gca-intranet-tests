import { request } from "@playwright/test";
import { urls } from "../../e2e-tests/tests/data/urls";

async function run() {
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failed = 0;

  for (const url of urls) {
    try {
      const res = await api.get(url, {
        timeout: 15000,
      });

      const status = res.status();

      if (status !== 200) {
        console.log(`FAIL  ${status}  ${url}`);
        failed++;
      } else {
        console.log(`PASS  ${status}  ${url}`);
      }
    } catch (err) {
      console.log(`ERROR ${url}`);
      failed++;
    }
  }

  console.log("\nDone");
  console.log(`Total: ${urls.length}`);
  console.log(`Failed: ${failed}`);

  await api.dispose();

  if (failed > 0) {
    process.exit(1);
  }
}

run();
