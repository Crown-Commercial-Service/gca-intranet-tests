import { test, expect } from "../../src/wp.fixtures";

test.describe("Team Contact Card taxonomy ACF API", { tag: "@smoke" }, () => {
  test("probe HR Directorate via wp/v2 and acf/v3 endpoints", async ({
    wp,
  }) => {
    const term = await wp.taxonomies.findTermBySlug(
      "responsible_team",
      "hr-directorate",
    );
    expect(term.id).toBeGreaterThan(0);

    console.log("=== wp/v2 GET term.acf ===");
    console.log(JSON.stringify(term.acf ?? null, null, 2));

    let acfV3Get: unknown = null;
    try {
      acfV3Get = await wp.taxonomies.getTermAcfV3(
        "responsible_team",
        term.id,
      );
    } catch (error) {
      acfV3Get = `ERROR: ${(error as Error).message}`;
    }
    console.log("=== acf/v3 GET response ===");
    console.log(JSON.stringify(acfV3Get, null, 2));

    const probeFields = {
      card_title: "HR Directorate (probe)",
      card_description: "E2E smoke probe via REST.",
    };

    let acfV3Post: unknown = null;
    try {
      acfV3Post = await wp.taxonomies.updateTermAcfV3(
        "responsible_team",
        term.id,
        probeFields,
      );
    } catch (error) {
      acfV3Post = `ERROR: ${(error as Error).message}`;
    }
    console.log("=== acf/v3 POST response ===");
    console.log(JSON.stringify(acfV3Post, null, 2));
  });
});
