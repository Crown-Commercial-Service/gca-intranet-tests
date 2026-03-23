import { request } from "@playwright/test";
import { urlRedirects } from "../../e2e-tests/tests/data/url_redirect";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "") || "/";
}

async function run() {
  const api = await request.newContext({
    ignoreHTTPSErrors: true,
  });

  let failed = 0;

  for (const { before, after } of urlRedirects) {
    try {
      const response = await api.get(before, {
        timeout: 15000,
      });

      const status = response.status();
      const finalUrl = response.url();

      const expectedUrl = new URL(after, before).toString();

      if (status !== 200) {
        console.log(`FAIL  ${status}  ${before}`);
        console.log(`      expected: ${expectedUrl}`);
        console.log(`      actual:   ${finalUrl}`);
        failed++;
        continue;
      }

      if (normalizeUrl(finalUrl) !== normalizeUrl(expectedUrl)) {
        console.log(`FAIL  REDIRECT MISMATCH  ${before}`);
        console.log(`      expected: ${expectedUrl}`);
        console.log(`      actual:   ${finalUrl}`);
        failed++;
        continue;
      }

      console.log(`PASS  ${before} -> ${finalUrl}`);
    } catch (error) {
      console.log(`ERROR ${before}`);
      if (error instanceof Error) {
        console.log(`      ${error.message}`);
      }
      failed++;
    }
  }

  console.log("\nDone");
  console.log(`Total: ${urlRedirects.length}`);
  console.log(`Failed: ${failed}`);

  await api.dispose();

  if (failed > 0) {
    process.exit(1);
  }
}

run();
