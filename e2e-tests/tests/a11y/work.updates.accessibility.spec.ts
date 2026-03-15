import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Accessibility - Work update component", () => {
  let post: Post;
  let postId: number;
  const label = "CCS live";
  const team = "Finance";

  test.beforeEach(async ({ wp, wordpressLoginPage, workUpdate }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");

    post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Transformation Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await workUpdate.gotoEdit(postId);
    await workUpdate.selectLabel(label);
    await workUpdate.selectTeam(team);
    await workUpdate.addAuthorImage("author-image.jpg");
    await workUpdate.update();
  });

  test("work update page should have no serious or critical accessibility violations", async ({
    workUpdate,
  }) => {
    await workUpdate.gotoById(postId);
    await workUpdate.checkAccessibilityFor([workUpdate.workUpdateSection]);
  });

  test("work update list page should have no serious or critical accessibility violations", async ({
    wp,
    workUpdateList,
  }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");

    const posts = Post.manyWorkUpdates(11);
    await wp.posts.createMany(posts);

    await workUpdateList.gotoWorkUpdateList();
    await workUpdateList.checkAccessibilityFor([
      workUpdateList.workUpdateListSection,
    ]);
  });
});
