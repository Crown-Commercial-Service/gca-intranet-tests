import { test, expect } from "../src/wp.fixtures";
import MenuPages from "../src/models/MenuPages";

test.describe("menu pages", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("Can create a GCA navigation menu and navigate it", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
    homepage,
  }) => {
    await wp.posts.createPages(MenuPages.all());

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.buildMenu(MenuPages.menu());
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertNavigationMenu(MenuPages.menu());

    await homepage.hoverParentLink("Business Processes");
    await homepage.selectSubNavigationItem(
      "Business Processes",
      "Accessibility",
    );
    await expect(homepage.page).toHaveURL("accessibility/");
  });
});
