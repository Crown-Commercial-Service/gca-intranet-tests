import dayjs from "dayjs";
import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Work update component", () => {
  let post: Post;
  let postId: number;
  let label = "CCS live";
  let team = "Finance";

  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");

    post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Transformation Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    postId = await wp.posts.create(post);
  });

  test("should display work update details", async ({ workUpdate }) => {
    await workUpdate.gotoEdit(postId);
    await workUpdate.selectLabel(label);
    await workUpdate.selectTeam(team);
    await workUpdate.addAuthorImage("author-image.jpg");

    await workUpdate.update();

    await workUpdate.gotoById(postId);
    await workUpdate.assertTitle(post.title);
    await workUpdate.assertContent(post.content);
    await workUpdate.assertWorkUpdateLabel(label);
    await workUpdate.assertAuthorImageVisible();
    await workUpdate.assertWorkUpdateTeam(team);
    await workUpdate.assertAuthor(process.env.WP_ADMIN_USERNAME!);
    await workUpdate.assertPublishedDate(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
  });
});
