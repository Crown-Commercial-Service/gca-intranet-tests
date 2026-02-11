import { test } from "../../src/ui.base.fixtures";

test.describe("Accessibility smoke", () => {
  test("homepage has no serious or critical violations", async ({
    homePage,
  }) => {
    await homePage.goto();
    await homePage.a11y();
  });
});
