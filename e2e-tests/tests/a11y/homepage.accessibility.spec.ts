import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import HomepageCustomizationSet from "../../src/models/HomepageCustomizationSet";

test.describe("Accessibility - Homepage", () => {
  test.beforeEach(async ({ wp, runId }) => {
    await wp.posts.clearByRunId(runId);
  });

  test("Homepage components (news, work updates, blogs, take a look, quick links) has no serious or critical violations", async ({
    homepage,
    wp,
    runId,
  }) => {
    const contentType = Post.homepageSet(runId);
    const customizations = HomepageCustomizationSet.homepageSet(runId);

    await wp.posts.createMany(contentType.news);
    await wp.posts.createMany(contentType.workUpdates);
    await wp.posts.create(contentType.blog);
    await wp.customizer.applyCustomization(customizations.takeALook);
    await wp.customizer.applyCustomization(customizations.quickLinks);

    await homepage.goto();

    await homepage.checkAccessibilityFor([
      homepage.latestNewsSectionSelector,
      homepage.workUpdatesSectionSelector,
      homepage.blogsSectionSelector,
      homepage.takeALookColumnSelector,
      homepage.quickLinksSelector,
    ]);
  });
});
