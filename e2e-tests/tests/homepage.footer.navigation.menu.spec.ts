import { test, expect } from "../src/wp.fixtures";
import FooterPages from "../src/models/FooterPages";

test.describe("footer navigation menu", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("can create footer links and navigate them", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
    homepage,
  }) => {
    // Create only the required pages
    await wp.posts.createPages([
      FooterPages.all()[0], // Accessibility1
      FooterPages.all()[1], // Cookie Setting & Policy1
    ]);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.buildFooterMenu([
      FooterPages.menu()[1], // Cookie Setting & Policy1
      FooterPages.menu()[3], // GCA Website
    ]);
    await customizerPage.publish();
    await homepage.goto();
    await homepage.assertFooterLinks([
      FooterPages.menu()[1],
      FooterPages.menu()[3],
    ]);
    await homepage.selectFooterLink("Cookie Setting & Policy1");
    await expect(homepage.page).toHaveURL(/cookie-setting-policy1\/$/);
    await homepage.goto();
    await homepage.selectFooterLink("GCA Website");
    await expect(homepage.page).toHaveURL(
      "https://www.crowncommercial.gov.uk/",
    );
  });

  test("can edit a footer link title and reorder it", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
    homepage,
  }) => {
    await wp.posts.createPages([FooterPages.all()[1]]);
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await customizerPage.goto();
    await customizerPage.buildFooterMenu([
      FooterPages.menu()[1],
      FooterPages.menu()[5],
    ]);
    await customizerPage.publish();
    await customizerPage.goto();
    await customizerPage.editFooterLinkLabel(
      "Cookie Setting & Policy1",
      "Cookie Setting & Policy2",
    );
    await customizerPage.moveFooterLink("Cookie Setting & Policy2", 0);
    await customizerPage.publish();
    await homepage.goto();
    await homepage.assertFooterLinks([
      { label: "Cookie Setting & Policy2", type: "page" },
      { label: "Submit Intranet Feedback", type: "custom" },
    ]);
  });
  test("can delete a footer link", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
    homepage,
  }) => {
    await wp.posts.createPages([
      FooterPages.all()[0],
      FooterPages.all()[1],
    ]);
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await customizerPage.goto();
    await customizerPage.buildFooterMenu([
      FooterPages.menu()[0],
      FooterPages.menu()[1],
    ]);
    await customizerPage.publish();
    await customizerPage.goto();
    await customizerPage.deleteFooterLink("Accessibility1");
    await customizerPage.publish();
    await homepage.goto();
    await homepage.assertFooterLinks([
      FooterPages.menu()[1], // Cookie Setting & Policy1
    ]);
  });
});
