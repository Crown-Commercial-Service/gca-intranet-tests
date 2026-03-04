import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Accessibility - Homepage", () => {
  test.beforeEach(async ({ wp, runId }) => {
    await wp.posts.clearByRunId(runId);
  });

  test("Homepage components (news, work updates, blogs) has no serious or critical violations", async ({
    homepage,
    wp,
    runId,
  }) => {
    const contentType = Post.homepageSet(runId);

    await wp.posts.createMany(contentType.news);
    await wp.posts.createMany(contentType.workUpdates);
    await wp.posts.create(contentType.blog);

    await homepage.goto();

    await homepage.checkAccessibilityFor(
      homepage.latestNewsSectionSelector,
      "Latest News Section",
    );
    await homepage.checkAccessibilityFor(
      homepage.workUpdatesSectionSelector,
      "Work Updates Section",
    );
    await homepage.checkAccessibilityFor(
      homepage.blogsSectionSelector,
      "homepage.blogs",
    );
  });
});
