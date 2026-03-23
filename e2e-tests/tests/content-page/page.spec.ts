import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Content page component", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("can create a 2 column template", { tag: "@regression" }, async ({
    wp,
    wordpressLoginPage,
    contentPage,
    runId,
  }) => {
    const templatePage = Post.aPage()
      .withFixedTitle(`Two Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    const pageId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await contentPage.gotoEdit(pageId);
    await contentPage.fillSlug(`two-column-template-${runId}`);
    await contentPage.selectColumnTemplate("Layout – 2 column");
    await contentPage.fillExcerpt(templatePage);
    await contentPage.selectAudience("Line managers");
    await contentPage.selectCategory("Digital and data");
    await contentPage.selectContentType("Staff network");
    await contentPage.selectTeam("Able Network");
    await contentPage.update();
    await contentPage.gotoById(pageId);
    await contentPage.assertTwoColumnTemplateIsApplied();
  });

  test("can add multiple page contents to a page", async ({
    wp,
    wordpressLoginPage,
    contentPage,
    runId,
  }) => {
    const templatePage = Post.aPage()
      .withFixedTitle(`Two Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    const pageId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

        await contentPage.gotoEdit(pageId);

    // await contentPage.pause()
    await contentPage.addTextComponent('oishfodofjo');

    await contentPage.update();

  });
});
