import { test, expect } from "../../src/wp.fixtures";

test.describe("Team Contact Card taxonomy ACF API", { tag: "@smoke" }, () => {
  test("inspect HR Directorate term shape via REST", async ({ wp }) => {
    const term = await wp.taxonomies.findTermBySlug(
      "responsible_team",
      "hr-directorate",
    );

    console.log("=== TERM (raw) ===");
    console.log(JSON.stringify(term, null, 2));

    console.log("=== TERM KEYS ===");
    console.log(Object.keys(term));

    console.log("=== TERM.acf ===");
    console.log(JSON.stringify(term.acf ?? null, null, 2));

    expect(term.id).toBeGreaterThan(0);
  });
});
