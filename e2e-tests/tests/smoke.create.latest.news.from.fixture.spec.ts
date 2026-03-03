import { test } from "../src/wp.fixtures";
import Post from "../src/models/Post";
import { loadFixture } from "../src/utils/loadFixture";
import { decode } from "html-entities";

test.describe("homepage - latest news", () => {
  test("should render a real production article on QA", async ({ wp, homepage }) => {
    const fixture = loadFixture("tests/data/latest-news-1.json");

    const post = Post.aPost()
      .withFixedTitle(decode(fixture.title))
      .withContent(fixture.contentHtml)
      .withFeaturedImage("featured-1-new.jpg")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertLatestNewsLayout([post]);
  });
});