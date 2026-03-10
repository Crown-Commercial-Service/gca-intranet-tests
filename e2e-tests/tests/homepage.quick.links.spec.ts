import { test, expect } from "../src/wp.fixtures";
import QuickLinks from "../src/models/QuickLinks";

test.describe("homepage - quick links", () => {
  test.skip("should display quick links component with correct content", async ({
    wp,
    homepage,
    runId,
  }) => {
    const quickLinks = QuickLinks.quickLinks()
      .withTitle(`Quick links ${runId}`)
      .withDescription(`Quick links description ${runId}`)
      .withLink1(`Link 1 ${runId}`, `https://example.com/link1/${runId}`)
      .withLink2(`Link 2 ${runId}`, `https://example.com/link2/${runId}`);

    await wp.customizer.applyCustomization(quickLinks);

    await homepage.goto();
    await homepage.assertQuickLinksComponent(quickLinks);
  });

  test("can edit a quick links component via wordpress customizer", async ({
    homepage,
    runId,
    wordpressLoginPage,
    customizerPage,
  }) => {
    const quickLinks = QuickLinks.quickLinks()
      .withTitle(`Quick links ${runId}`)
      .withDescription(`Quick links description ${runId}`)
      .withLink1(`Link 1 ${runId}`, `https://example.com/link1/${runId}`)
      .withLink2(`Link 2 ${runId}`, `https://example.com/link2/${runId}`)
      .withLink3(`Link 3 ${runId}`, `https://example.com/link3/${runId}`);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.updateQuickLinks(quickLinks);
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertQuickLinksComponent(quickLinks);

    const updatedQuickLinks = QuickLinks.quickLinks()
      .withTitleMaxChars(300)
      .withDescriptionMaxChars(600)
      .withLink1(
        `Updated link 1 ${runId}`,
        `https://example.com/updated-link1/${runId}`,
      )
      .withLink2(
        `Updated link 2 ${runId}`,
        `https://example.com/updated-link2/${runId}`,
      )
      .withLink3(
        `Updated link 3 ${runId}`,
        `https://example.com/updated-link3/${runId}`,
      );

    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.updateQuickLinks(updatedQuickLinks);
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertQuickLinksComponent(updatedQuickLinks);
  });

  test.skip("can navigate to the first quick link url", async ({
    wp,
    homepage,
    runId,
  }) => {
    const quickLinks = QuickLinks.quickLinks().withLink1(
      `Link 1 ${runId}`,
      `https://example.com/link1/${runId}`,
    );

    await wp.customizer.applyCustomization(quickLinks);

    await homepage.goto();
    await homepage.quickLinksItems.first().click();

    await expect(homepage.page).toHaveURL(quickLinks.links[0].url);
  });
});
