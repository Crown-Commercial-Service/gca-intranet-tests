import { test, expect } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("templates - three column (category)", () => {
  test("should render the three column template for HR category page", async ({
    wp,
    page,
  }) => {
    const categoryName = "HR";
    const templateLabel = "Three Column Template (Category)";

    // Create 3 posts in HR
    const post1 = Post.aPost()
      .withFixedTitle("E2E HR Column 1")
      .withStatus("publish")
      .withCategory(categoryName)
      .withFeaturedImage("featured.jpg");

    const post2 = Post.aPost()
      .withFixedTitle("E2E HR Column 2")
      .withStatus("publish")
      .withCategory(categoryName)
      .withFeaturedImage("featured.jpg");

    const post3 = Post.aPost()
      .withFixedTitle("E2E HR Column 3")
      .withStatus("publish")
      .withCategory(categoryName)
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(post1);
    await wp.posts.create(post2);
    await wp.posts.create(post3);

    // Create the HR page
    const hrPage = Post.aPage()
      .withFixedTitle("HR Page")
      .withStatus("publish")
      .withCategory(categoryName);

    const pageId = await wp.posts.create(hrPage);

    // ---- Login to WP Admin ----
    const adminBaseUrl = process.env.WP_ADMIN_BASE_URL!;
    const adminUsername = process.env.WP_ADMIN_USERNAME!;
    const adminPassword = process.env.WP_ADMIN_PASSWORD!;

    await page.goto(`${adminBaseUrl}/wp-login.php`, {
      waitUntil: "domcontentloaded",
    });

    await page.fill("#user_login", adminUsername);
    await page.fill("#user_pass", adminPassword);
    await page.click("#wp-submit");

    // ---- Open edit screen ----
    await page.goto(
      `${adminBaseUrl}/wp-admin/post.php?post=${pageId}&action=edit`,
      { waitUntil: "domcontentloaded" },
    );

    // ---- Select template ----
    await page.selectOption("#page_template", {
      label: templateLabel,
    });

    // ---- Click Update ----
    await page.getByRole("button", { name: "Update" }).click();

    // ---- Visit page ----
    await page.goto(`/index.php?page_id=${pageId}`, {
      waitUntil: "domcontentloaded",
    });

    // ---- Assert 3 cards rendered ----
    await expect(page.locator('[data-testid="card"]')).toHaveCount(3);
  });
});
