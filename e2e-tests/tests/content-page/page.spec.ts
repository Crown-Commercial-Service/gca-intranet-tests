import dayjs from "dayjs";
import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";
import { formatDateOld } from "../../src/utils/formatters";

test.describe("Latest news component", () => {
  test(
    "can create a 2 column template",
    { tag: "@regression" },
    async ({ wp, wordpressLoginPage, contentPage, runId, latestNews }) => {
      const slug = `two-column-template-${runId}`;
      const title = `Two Column Template ${runId}`;
      const templatePage = Post.aPage()
        .withFixedTitle(title)
        .withRealisticBodyContent("long")
        .withFeaturedImage("featured.jpg")
        .withStatus("publish");

      const pageId = await wp.posts.create(templatePage);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.loginAsAdmin();

      await contentPage.gotoEdit(pageId);
      await contentPage.fillSlug(slug);
      await contentPage.selectTwoColumnTemplate();
      await contentPage.fillExcerpt(templatePage);
      await contentPage.selectAudience("Line managers");
      await contentPage.selectCategory("Digital and data");
      await contentPage.selectContentType("Staff network");
      await contentPage.selectTeam("Able Network");
      await contentPage.update();
      await latestNews.gotoById(pageId);
      await contentPage.assertTwoColumnTemplateIsApplied();
    },
  );
});
