import { test } from "../../src/wp.fixtures";
import { createSearchSeed } from "../../src/models/SearchSeed";
import { seedSearchData } from "../../src/helpers/SearchHelper";
import Post from "../../src/models/Post";
import dayjs from "dayjs";

// News items should NOT appear in search results (filtered by the application).
test.describe("search", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
    await wp.posts.clearByTypeAndAuthor("news");
    await wp.posts.clearByTypeAndAuthor("blogs");
    await wp.posts.clearByTypeAndAuthor("work_updates");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
    await wp.posts.clearByTypeAndAuthor("news");
    await wp.posts.clearByTypeAndAuthor("blogs");
    await wp.posts.clearByTypeAndAuthor("work_updates");
  });

  test("should open the search results page and show supported content results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: searching from the header should open the search results page and show the searched term, results count and results page search box.
    // Data setup: creates 6 matching results across pages, blogs and work updates using a unique runId keyword.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await homepage.goto();

    await homepage.search(seed.keyword);
    await searchResultsPage.assertHeadingContainsQuery(seed.keyword);
    await searchResultsPage.assertSearchInputVisible();
    await searchResultsPage.assertResultsCountVisible();
    await searchResultsPage.assertResultCount(6);
  });

  test("should show content type, title link and description for each supported result type", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: results should be structured with content type, linked title and description for pages, blogs and work updates.
    // Data setup: creates one searchable page, blog and work update under the same unique keyword.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await homepage.goto();

    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultHasType(seed.pages[0].title, "Page");
    await searchResultsPage.assertResultHasLink(seed.pages[0].title);
    await searchResultsPage.assertResultHasExcerpt(seed.pages[0].title);

    await searchResultsPage.assertResultHasType(seed.blogs[0].title, "Blog");
    await searchResultsPage.assertResultHasLink(seed.blogs[0].title);
    await searchResultsPage.assertResultHasExcerpt(seed.blogs[0].title);

    await searchResultsPage.assertResultHasType(
      seed.workUpdates[0].title,
      "Work Update",
    );
    await searchResultsPage.assertResultHasLink(seed.workUpdates[0].title);
    await searchResultsPage.assertResultHasExcerpt(seed.workUpdates[0].title);
  });

  test("should show the total number of returned search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: the results page should show the total number of results returned for the searched term.
    // Data setup: creates 6 matching records for one unique keyword.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultsCount(6);
  });

  test("should show pagination when search results exceed 10 items", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: pagination should be shown when more than 10 results exist and only 10 results should appear on the first page.
    // Data setup: creates the standard 6 matching records (pages, blogs, work updates) plus 8 extra matching blog records.

    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    const extraBlogs = Post.manyBlogs(8, keyword);

    await seedSearchData(wp, seed);
    await wp.posts.createMany(extraBlogs);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultCount(10);
    await searchResultsPage.assertPaginationVisible();
  });

  test("should not show pagination when search results are 10 items or fewer", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: pagination should not be shown when 10 or fewer results are returned.
    // Data setup: creates only the standard 6 matching records.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultCount(6);
    await searchResultsPage.assertPaginationNotVisible();
  });

  test("should show a no results state for an unmatched search term", async ({
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: when nothing matches, the page should show the searched term, the results page search box and the no results message.
    // Data setup: no content is created and a unique runId term is searched so zero results are guaranteed.
    const query = `NoMatch-${runId}`;

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(query);

    await searchResultsPage.assertHeadingContainsQuery(query);
    await searchResultsPage.assertSearchInputVisible();
    await searchResultsPage.assertNoResultsMessageVisible(query);
  });

  test("should submit a header search when Enter is pressed", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: the user must be able to search from the header using the Enter key.
    // Data setup: creates 6 matching records for one unique keyword.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.searchWithEnter(seed.keyword);

    await searchResultsPage.assertHeadingContainsQuery(seed.keyword);
    await searchResultsPage.assertSearchInputVisible();
    await searchResultsPage.assertResultsCountVisible();
    await searchResultsPage.assertResultCount(6);
  });

  test("should allow the user to search again from the search results page", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: the search results page search box should allow the user to perform another search.
    // Data setup: creates two separate 6-result datasets under two different unique keywords.
    const firstKeyword = `Procurement-${runId}`;
    const secondKeyword = `Governance-${runId}`;

    const firstSeed = createSearchSeed(firstKeyword);
    const secondSeed = createSearchSeed(secondKeyword);

    await seedSearchData(wp, firstSeed);
    await seedSearchData(wp, secondSeed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(firstSeed.keyword);

    await searchResultsPage.assertHeadingContainsQuery(firstSeed.keyword);
    await searchResultsPage.search(secondSeed.keyword);

    await searchResultsPage.assertHeadingContainsQuery(secondSeed.keyword);
    await searchResultsPage.assertSearchInputValue(secondSeed.keyword);
    await searchResultsPage.assertResultsCountVisible();
  });

  test("should hide the header search and show the search box on the results page", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: once the user is on the results page, the search box should be shown there instead of in the header.
    // Data setup: creates 6 matching records for one unique keyword.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertSearchInputVisible();
    await homepage.assertHeaderSearchNotVisible();
  });

  test("should show the newest result first in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    const keyword = `Ordering-${runId}`;
    const now = dayjs();

    const first = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`${keyword} First result`)
      .withContent(`${keyword} first result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(6, "minute").toDate())
      .withFeaturedImage("featured.jpg");

    const second = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`${keyword} Second result`)
      .withContent(`${keyword} second result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(3, "minute").toDate())
      .withFeaturedImage("featured.jpg");

    const third = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`${keyword} Third result`)
      .withContent(`${keyword} third result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(1, "minute").toDate())
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(first);
    await wp.posts.create(second);
    await wp.posts.create(third);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertFirstResultTitle(third.title);
    await searchResultsPage.assertResultVisible(first.title);
    await searchResultsPage.assertResultVisible(second.title);
    await searchResultsPage.assertResultVisible(third.title);
  });

  test("should truncate long result titles and descriptions", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: long titles and long descriptions should be truncated on the search results page.
    // Data setup: creates one blog post with an intentionally long title and long content.
    const keyword = `SearchTruncation-${runId}`;

    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle(
        `${keyword} this is a very long search result title designed to exceed the eighty five character limit on the search results page`,
      )
      .withContent(
        `${keyword} this is a very long excerpt designed to exceed one hundred and twenty five characters so that the search results page has to truncate the visible description for the user`,
      )
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertResultTitleIsTruncated(post.title);
    await searchResultsPage.assertResultExcerptIsTruncated(post.content);
  });

  test("should display terms for blogs and work updates in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    blog,
    workUpdate,
    runId,
  }) => {
    // AC: categories and labels should appear as tags in search results where supported (excluding news).
    // Data setup: seeds mixed content, then updates blog and work update through the WP UI to apply visible terms.

    const keyword = `Terms-${runId}`;
    const seed = createSearchSeed(keyword);

    const ids = await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await blog.gotoEdit(ids.blogIds[0]);
    await blog.selectLabel("Reward");
    await blog.update();

    await workUpdate.gotoEdit(ids.workUpdateIds[0]);
    await workUpdate.selectLabel("CCS live");
    await workUpdate.update();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultHasTerm(seed.blogs[0].title, "Reward");
    await searchResultsPage.assertResultHasTerm(
      seed.workUpdates[0].title,
      "CCS live",
    );
  });

  test("should not show an audience tag when no audience is selected", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    blog,
    runId,
  }) => {
    // Additional coverage: verifies that no audience tag is shown when no audience is applied.
    // Data setup: creates one blog result and leaves audience unset before searching.
    const keyword = `AudienceNone-${runId}`;

    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`${keyword} result`)
      .withContent(`${keyword} content`)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    const postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await blog.gotoEdit(postId);
    await blog.update();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertResultHasLink(post.title);
    await searchResultsPage.assertResultHasExcerpt(post.title);
    await searchResultsPage.assertResultDoesNotHaveTerm(
      post.title,
      "Line managers",
    );
  });

  test("should not show an audience tag when page audience is All colleagues", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // Additional coverage: verifies that the default audience value All colleagues should not appear as a visible tag.
    // Data setup: creates one page, selects All colleagues in the WP UI, then searches for that page.
    const keyword = `AudienceAll-${runId}`;

    const page = Post.aPage()
      .withFixedTitle(`${keyword} result`)
      .withContent(`${keyword} content`)
      .withStatus("publish");

    const pageId = await wp.posts.create(page);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await searchResultsPage.gotoEdit(pageId);
    await searchResultsPage.selectAudience("All colleagues");
    await searchResultsPage.update();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertResultHasLink(page.title);
    await searchResultsPage.assertResultHasExcerpt(page.title);
    await searchResultsPage.assertResultDoesNotHaveTerm(
      page.title,
      "All colleagues",
    );
  });

  test("should show Page as the content type when a page has no content type selected", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: for pages without a selected content type, the result should fall back to Page.
    // Data setup: creates one page with no content type selected and searches for it.
    const keyword = `PageTypeDefault-${runId}`;

    const page = Post.aPage()
      .withFixedTitle(`${keyword} Policy Hub`)
      .withContent(`${keyword} guidance and support`)
      .withStatus("publish");

    await wp.posts.create(page);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertResultHasType(page.title, "Page");
    await searchResultsPage.assertResultHasLink(page.title);
    await searchResultsPage.assertResultHasExcerpt(page.title);
  });

  test("should show the selected page content type in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: for pages with a selected content type, the result should show that selected content type instead of Page.
    // Data setup: creates one page, selects Staff network in the WP UI, then searches for it.
    const keyword = `PageTypeSelected-${runId}`;

    const page = Post.aPage()
      .withFixedTitle(`${keyword} Policy Hub`)
      .withContent(`${keyword} guidance and support`)
      .withStatus("publish");

    const pageId = await wp.posts.create(page);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await searchResultsPage.gotoEdit(pageId);
    await searchResultsPage.selectContentType("Staff network");
    await searchResultsPage.update();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertResultHasType(page.title, "Staff network");
    await searchResultsPage.assertResultHasLink(page.title);
    await searchResultsPage.assertResultHasExcerpt(page.title);
  });

  test("should not display news content in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: news content should not appear in search results
    // Data setup: create a unique news item and search for it

    const keyword = `ExcludeNews-${runId}`;

    const newsPost = Post.aPost()
      .withType("news")
      .withFixedTitle(`${keyword} News item`)
      .withContent(`${keyword} content`)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(newsPost);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(keyword);

    // Assert news item is NOT visible in results
    await searchResultsPage.assertResultNotVisible(newsPost.title);
  });
});
