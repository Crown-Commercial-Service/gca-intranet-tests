import dayjs from "dayjs";
import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Accessibility - Blog component", () => {
  let post: Post;
  let postId: number;
  const label = "CCS live";

  test.beforeEach(async ({ wp, wordpressLoginPage, blog }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");

    post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("Commercial Strategy Blog")
      .withParagraphMaxChars(180)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await blog.gotoEdit(postId);
    await blog.selectLabel(label);
    await blog.addAuthorImage("author-image.jpg");
    await blog.update();
  });

  test(
    "blogs page should have no serious or critical accessibility violations",
    { tag: "@regression" },
    async ({ blog }) => {
      await blog.gotoById(postId);
      await blog.assertPublishedDate(
        dayjs(post.createdAt).format("Do MMMM YYYY"),
      );
      await blog.checkAccessibilityFor([blog.blogsSection]);
    },
  );

  test(
    "blog list page should have no serious or critical accessibility violations",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();
      await blogList.checkAccessibilityFor([blogList.blogsListSection]);
    },
  );
});
