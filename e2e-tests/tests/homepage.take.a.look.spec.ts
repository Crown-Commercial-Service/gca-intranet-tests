import { test, expect } from "../src/wp.fixtures";
import TakeALook from "../src/models/TakeALook";

test.describe("homepage - take a look", () => {
  test("should display a look component with correct content", async ({
    wp,
    homepage,
    runId,
  }) => {
    const takeALook = TakeALook.aTakeALook()
      .withRunId(runId)
      .withTitle(`E2E Take a look ${runId}`)
      .withDescription(`E2E description ${runId}`)
      .withLinkText(`E2E link text ${runId}`)
      .withLinkUrl(`https://example.com/${runId}`)
      .build();

    await wp.customizer.setTakeALook(takeALook);

    await homepage.goto();

    const root = homepage.page.getByTestId("take-a-look-column");
    await expect(root).toBeVisible();

    const heading = homepage.page.getByTestId("take-a-look-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(takeALook.title);

    await expect(root).toContainText(takeALook.description);

    const link = homepage.page.getByTestId("take-a-look-link");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", takeALook.linkUrl);

    const linkTextEl = root.locator("p.gca-take-a-look__text");
    await expect(linkTextEl).toBeVisible();
    await expect(linkTextEl).toHaveText(takeALook.linkText);
  });
});
