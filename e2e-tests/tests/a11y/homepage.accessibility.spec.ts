import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import TakeALook from "../../src/models/TakeALook";

test.describe("Accessibility - Homepage", () => {
  test.beforeEach(async ({ wp, runId }) => {
    await wp.posts.clearByRunId(runId);
  });

  test("Homepage components (news, work updates, blogs, take a look) has no serious or critical violations", async ({
    homepage,
    wp,
    runId,
  }) => {
    const contentType = Post.homepageSet(runId);

    await wp.posts.createMany(contentType.news);
    await wp.posts.createMany(contentType.workUpdates);
    await wp.posts.create(contentType.blog);

    const takeALook = TakeALook.aTakeALook()
      .withTitle("Take a look")
      .withDescription("E2E description")
      .withLinkText(`E2E link text ${runId}`)
      .withLinkUrl(`https://example.com/${runId}`);

    await wp.customizer.applyCustomization(takeALook);

    await homepage.goto();

    await homepage.checkAccessibilityFor([
      homepage.latestNewsSectionSelector,
      homepage.workUpdatesSectionSelector,
      homepage.blogsSectionSelector,
      homepage.takeALookColumnSelector,
    ]);
  });
});
