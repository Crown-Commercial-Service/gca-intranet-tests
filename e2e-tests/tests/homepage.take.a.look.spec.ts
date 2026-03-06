import { test, expect } from "../src/wp.fixtures";
import TakeALook from "../src/models/TakeALook";

test.describe("homepage - take a look", () => {
  test("should display take a look component with correct content", async ({
    wp,
    homepage,
    runId,
  }) => {
    const takeALook = TakeALook.aTakeALook()
      .withTitle(`E2E Take a look ${runId}`)
      .withDescription(`E2E description ${runId}`)
      .withLinkText(`E2E link text ${runId}`)
      .withLinkUrl(`https://example.com/${runId}`);

    await wp.customizer.applyCustomization(takeALook);

    await homepage.goto();
    await homepage.assertTakeALookComponent(takeALook);
  });

  test("can edit a take a look component via wordpress customizer", async ({
    wp,
    homepage,
    page,
    runId,
    wordpressLoginPage,
    customizerPage,
  }) => {
    const takeALook = TakeALook.aTakeALook()
      .withTitle(`E2E Take a look ${runId}`)
      .withDescription(`E2E description ${runId}`)
      .withLinkText(`E2E link text ${runId}`)
      .withLinkUrl(`https://example.com/${runId}`);

    await wp.customizer.applyCustomization(takeALook);
    await homepage.goto();
    await homepage.assertTakeALookComponent(takeALook);
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsDockerAdmin();

    const updatedTakeALook = TakeALook.aTakeALook()
      .withTitleMaxChars(300)
      .withDescriptionMaxChars(600)
      .withLinkText(`Updated link text ${runId}`)
      .withLinkUrl(`https://example.com/updated/${runId}`);

    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.updateTakeALook(updatedTakeALook);
    await customizerPage.publish();
    await homepage.goto();
    await homepage.assertTakeALookComponent(updatedTakeALook);
  });

  test("can navigate to the take a look url", async ({
    wp,
    homepage,
    runId,
  }) => {
    const takeALook = TakeALook.aTakeALook().withLinkUrl(
      `https://example.com/${runId}`,
    );

    await wp.customizer.applyCustomization(takeALook);

    await homepage.goto();
    await homepage.takeALookLink.click();

    await expect(homepage.page).toHaveURL(takeALook.linkUrl);
  });
});
