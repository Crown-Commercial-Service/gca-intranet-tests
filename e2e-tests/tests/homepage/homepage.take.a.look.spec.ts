import { test, expect } from "../../src/wp.fixtures";
import TakeALook from "../../src/models/TakeALook";

test.describe("homepage - take a look", { tag: '@regression' }, () => {
  test("can create a take a look component via wordpress customizer", async ({
    homepage,
    wordpressLoginPage,
    customizerPage,
  }) => {
    const takeALook = TakeALook.aTakeALook()
      .withTitle("Take a look")
      .withDescription("Useful content and services for GCA staff")
      .withLinkText("Visit the GCA knowledge hub")
      .withLinkUrl("https://example.com/gca-knowledge-hub");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.updateTakeALook(takeALook);
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertTakeALookComponent(takeALook);
  });

  test("can edit a take a look component via wordpress customizer", async ({
    homepage,
    runId,
    wordpressLoginPage,
    customizerPage,
  }) => {
    const takeALook = TakeALook.aTakeALook()
      .withTitle(`Take a look ${runId}`)
      .withDescription(`Useful links for staff ${runId}`)
      .withLinkText(`Visit resource ${runId}`)
      .withLinkUrl(`https://example.com/resource/${runId}`);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.updateTakeALook(takeALook);
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertTakeALookComponent(takeALook);

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
    homepage,
    wordpressLoginPage,
    customizerPage,
  }) => {
    const takeALook = TakeALook.aTakeALook()
      .withTitle("Take a look")
      .withDescription("Useful content and services for GCA staff")
      .withLinkText("Open knowledge hub")
      .withLinkUrl("https://example.com/gca-knowledge-hub");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.updateTakeALook(takeALook);
    await customizerPage.publish();

    await homepage.goto();
    await homepage.takeALookLink.click();

    await expect(homepage.page).toHaveURL(takeALook.linkUrl);
  });
});
