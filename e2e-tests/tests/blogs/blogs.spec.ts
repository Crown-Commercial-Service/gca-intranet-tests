import dayjs from "dayjs";
import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";

test.describe("Blog component", () => {
  let post: Post;
  let postId: number;
  let label = "CCS live";

  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
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
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test(
    "should display blog details",
    { tag: "@regression" },
    async ({ blog }) => {
      await blog.gotoEdit(postId);
      await blog.selectLabel(label);
      await blog.addAuthorImage("author-image.jpg");
      await blog.update();

      await blog.gotoById(postId);
      await blog.assertTitle(post.title);
      await blog.assertContent(post.content);
      await blog.assertBlogLabel(label);
      await blog.assertAuthor(process.env.WP_ADMIN_USERNAME!);
      await blog.assertFeaturedImageVisible();
      await blog.assertPublishedDate(
        dayjs(post.createdAt).format("Do MMMM YYYY"),
      );
    },
  );

  test(
    "can navigate using breadcrumb",
    { tag: "@regression" },
    async ({ blog, homepage, blogList }) => {
      await blog.gotoById(postId);

      await blog.selectBreadcrumbLink("Home");
      await homepage.expectUrlToContain("/");

      await blog.gotoById(postId);

      await blog.selectBreadcrumbLink("Blogs");
      await expect(blogList.main).toBeVisible();
    },
  );

  test(
    "should display blog details on the blog list page",
    { tag: "@regression" },
    async ({ blogList }) => {
      await blogList.gotoBlogList();
      await blogList.assertPostVisible(post.title);
      await blogList.assertPostHasDate(
        post.title,
        dayjs(post.createdAt).format("Do MMMM YYYY"),
      );
      await blogList.assertPostHasContent(post.title, post.content);
      await blogList.assertPostHasFeaturedImage(post.title);
    },
  );

  test(
    "should display 10 blogs and show pagination when there are more than 10",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();

      await blogList.assertPostCount(10);
      await blogList.assertPaginationVisible();
    },
  );

  test.skip("should not display pagination when there are fewer than 10 blogs", async ({
    wp,
    blogList,
  }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
    const posts = Post.manyBlogs(9);

    await wp.posts.createMany(posts);
    await blogList.gotoBlogList();

    await blogList.assertPostCount(9);
    await blogList.assertPaginationNotVisible();
  });

  test(
    "should show next button but not previous button on the first pagination page",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();

      await blogList.assertPaginationVisible();
      await blogList.assertNextPaginationVisible();
      await blogList.assertPreviousPaginationNotVisible();
    },
  );

  test(
    "should hide next button on the last pagination page",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();

      await blogList.goToLastPaginationPage();
      await blogList.assertNextPaginationNotVisible();
    },
  );

  test(
    "should show correct author after updating a blog article",
    { tag: "@regression" },
    async ({ wp, blog }) => {
      const username = `e2e_author_${Date.now()}`;
      const newUser = User.anAdmin()
        .withUsername(username)
        .withEmail(`${username}@example.com`);

      await wp.users.upsert(newUser);
      await blog.gotoEdit(postId);
      await blog.selectAuthor(newUser.username);
      await blog.update();
      await blog.gotoById(postId);
      await blog.assertAuthor(newUser.username);
    },
  );
});
