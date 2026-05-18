import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";

test.describe("social - likes and comments", { tag: "@regression" }, () => {
  const postOwner = User.aSubscriber()
    .withUsername("e2e-social-post-owner")
    .withEmail("e2e-social-post-owner@example.com")
    .withPassword("Password123!");

  const postViewer = User.aSubscriber()
    .withUsername("e2e-social-post-viewer")
    .withEmail("e2e-social-post-viewer@example.com")
    .withPassword("Password123!");

  test.beforeEach(async ({ wp }) => {
    await wp.users.upsert(postOwner);
    await wp.users.upsert(postViewer);
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test("post owner comments and likes their own comment; post viewer sees the comment and like count", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Likes")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    // post owner: comment + self-like
    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.addComment("Great post!");
    await blog.assertCommentVisible(postOwner.username, "Great post!");
    await blog.assertLikeCount("Great post!", 0);

    await blog.likeComment("Great post!");
    await blog.assertLikeCount("Great post!", 1);

    // post viewer: same post should show the comment and the like
    await auth.loginAs(postViewer);
    await blog.gotoPath(link);
    await blog.assertCommentVisible(postOwner.username, "Great post!");
    await blog.assertLikeCount("Great post!", 1);
  });

  test("like count increments when another user likes the same comment", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Like Count")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.addComment("Helpful summary, thanks");
    await blog.likeComment("Helpful summary, thanks");
    await blog.assertLikeCount("Helpful summary, thanks", 1);

    await auth.loginAs(postViewer);
    await blog.gotoPath(link);
    await blog.likeComment("Helpful summary, thanks");
    await blog.assertLikeCount("Helpful summary, thanks", 2);
  });

  test("post owner can delete their own comment via the confirmation modal", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Delete Own")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.addComment("This is a draft thought I'll remove");
    await blog.assertCommentVisible(
      postOwner.username,
      "This is a draft thought I'll remove",
    );

    await blog.startDeleteComment("This is a draft thought I'll remove");
    await blog.assertDeleteConfirmationVisible();
    await blog.confirmDeleteComment();

    await blog.assertCommentNotVisible("This is a draft thought I'll remove");
  });

  test("post viewer cannot delete post owner's comment", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Delete Forbidden")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.addComment("Only the author can remove this");

    await auth.loginAs(postViewer);
    await blog.gotoPath(link);
    await blog.assertCommentVisible(
      postOwner.username,
      "Only the author can remove this",
    );
    await blog.assertDeleteUnavailable("Only the author can remove this");
  });

  test("post viewer can reply to post owner's comment", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Reply Cross-User")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.addComment("Anyone else seeing this in their team?");

    await auth.loginAs(postViewer);
    await blog.gotoPath(link);
    await blog.replyToComment(
      "Anyone else seeing this in their team?",
      "Yes, same here",
    );

    await blog.assertReplyVisible(
      "Anyone else seeing this in their team?",
      postViewer.username,
      "Yes, same here",
    );
  });

  test("post owner can reply to their own comment", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Reply Self")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.addComment("First thought");
    await blog.replyToComment("First thought", "Adding more context");

    await blog.assertReplyVisible(
      "First thought",
      postOwner.username,
      "Adding more context",
    );
  });

  test("post owner can @mention post viewer in a comment", async ({
    wp,
    auth,
    blog,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Social Mention")
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const link = await wp.posts.getPostLink(postId, "blogs");

    await auth.loginAs(postOwner);
    await blog.gotoPath(link);
    await blog.composeCommentWithMention("Have a look at this ", postViewer);
    await blog.submitComment();

    await blog.assertCommentMentions(postOwner.username, postViewer);
  });
});
