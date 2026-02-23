import { test, expect } from "../../src/wp.fixtures";
import AxeBuilder from "@axe-core/playwright";
import Post from "../../src/models/Post";

test.describe("Accessibility smoke", () => {
  test("latest news column has no serious or critical violations", async ({
    homepage,
    wp,
    page,
  }) => {
    const post1 = Post.aPost()
      .withFixedTitle("Post 1")
      .withFeaturedImage("img-1.jpg")
      .withStatus("publish");

    const post2 = Post.aPost()
      .withFixedTitle("Post 2")
      .withFeaturedImage("img-2.jpg")
      .withStatus("publish");

    const post3 = Post.aPost()
      .withFixedTitle("Post 3")
      .withFeaturedImage("img-3.jpg")
      .withStatus("publish");

    const post4 = Post.aPost()
      .withFixedTitle("Post 4")
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    await wp.posts.create(post1);
    await wp.posts.create(post2);
    await wp.posts.create(post3);
    await wp.posts.create(post4);

    await homepage.goto();

    const results = await new AxeBuilder({ page })
      .include('[data-testid="latest-news-column"]')
      .analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });
});