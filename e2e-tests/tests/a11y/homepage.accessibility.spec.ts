import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import MenuPages from "../../src/models/MenuPages";
import HomepageCustomizationSet from "../../src/models/HomepageCustomizationSet";

test.describe("Accessibility - Homepage", () => {
  test.beforeEach(async ({ wp, runId }) => {
    await wp.posts.clearByRunId(runId);
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("Homepage components and navigation have no serious or critical violations", async ({
    homepage,
    wp,
    runId,
    wordpressLoginPage,
    customizerPage,
  }) => {
    const contentType = Post.homepageSet(runId);
    const customizations = HomepageCustomizationSet.homepageSet(runId);

    await wp.posts.createMany(contentType.news);
    await wp.posts.createMany(contentType.workUpdates);
    await wp.posts.create(contentType.blog);
    await wp.posts.createPages(MenuPages.all());

    await wp.customizer.applyCustomization(customizations.takeALook);
    await wp.customizer.applyCustomization(customizations.quickLinks);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await customizerPage.goto();
    await customizerPage.buildMenu(MenuPages.menu());
    await customizerPage.publish();

    await homepage.goto();
    await homepage.hoverParentLink("Parent Nav Link 1");
    await homepage.checkAccessibilityFor([
      homepage.latestNewsSectionSelector,
      homepage.workUpdatesSectionSelector,
      homepage.blogsSectionSelector,
      homepage.takeALookColumnSelector,
      homepage.quickLinksSelector,
      homepage.primaryNavigationSelector,
      homepage.subMenuNavigation
    ]);
  });
});
