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
    await wp.posts.createPages(FooterPages.all());

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.buildFooterMenu(FooterPages.menu());
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertFooterLinks(FooterPages.menu());

    // Navigate to 1 page footer and 1 custom link footer to check url. no need to navigate to all
    await homepage.goto();
    await homepage.selectFooterLink("Cookie Setting & Policy1");
    await expect(homepage.page).toHaveURL("cookie-setting-policy1/");

    await homepage.goto();
    await homepage.selectFooterLink("GCA Website");
    await expect(homepage.page).toHaveURL(
      "https://www.crowncommercial.gov.uk/",
    );
  });
});
