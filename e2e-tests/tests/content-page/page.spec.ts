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
    await contentPage.selectColumnTemplate("Layout - 2 column");
    await contentPage.fillExcerpt(templatePage);
    await contentPage.selectAudience("Line managers");
    await contentPage.selectCategory("Digital and data");
    await contentPage.selectContentType("Staff network");
    await contentPage.selectTeam("Able Network");
    await contentPage.update();
    await contentPage.gotoById(pageId);
    await contentPage.assertTwoColumnTemplateIsApplied();
  });

  test(
    "HR Directorate contact card displays on a published page",
    { tag: "@regression" },
    async ({ wp, wordpressLoginPage, contentPage, runId }) => {
      const templatePage = Post.aPage()
        .withFixedTitle(`Contact Card Test ${runId}`)
        .withParagraphMaxChars(180)
        .withStatus("publish");

      const pageId = await wp.posts.create(templatePage);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.loginAsAdmin();

      await contentPage.gotoEdit(pageId);
      await contentPage.selectTeam("HR Directorate");
      await contentPage.update();

      await contentPage.gotoById(pageId);

      await contentPage.openContactCard();
      await contentPage.assertContactCardTitle("HR Directorate");
      await contentPage.assertContactCardDescription(
        "Short description shown below the heading",
      );
      await contentPage.assertContactCardItemCount(3);
      await contentPage.assertContactCardItem({
        title: "Email",
        subtitle: "hr-connect@gca.gov.uk",
      });
      await contentPage.assertContactCardItem({
        title: "Contact",
        subtitle: "08000000000",
      });
      await contentPage.assertContactCardItem({
        title: "Link",
        subtitle: "Example",
        href: "http://www.example.com",
      });
    },
  );

  test.skip("can add multiple page contents to a page", async ({
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
