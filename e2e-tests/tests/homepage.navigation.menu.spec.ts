import { test } from "../src/wp.fixtures";
import MenuPages from "../src/models/MenuPages";

test.describe("menu pages", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("should create and publish a GCA navigation menu", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
  }) => {
    await wp.posts.createPages(MenuPages.all());

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsDockerAdmin();

    await customizerPage.goto();
    await customizerPage.buildMenu(MenuPages.menu());
    await customizerPage.publish();
  });
});
