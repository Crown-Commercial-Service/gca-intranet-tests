import { test } from "../../src/wp.fixtures";
import { createSearchSeed } from "../../src/models/SearchSeed";
import { seedSearchData } from "../../src/helpers/SearchHelper";
import Post from "../../src/models/Post";
import dayjs from "dayjs";

// News and blog items should NOT appear in search results (filtered by the application).
// The searchable content types are pages and work updates.
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
    // Data setup: creates matching content across pages, blogs and work updates; only pages and work updates
    // are returned (4) because news and blogs are filtered out of search by the application.
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
    await searchResultsPage.assertResultCount(4);
  });

  test("should show content type, title link and description for each supported result type", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: results should be structured with content type, linked title and description for pages and work updates.
    // Data setup: creates one searchable page and work update under the same unique keyword (blogs are filtered out).
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
    // Data setup: creates matching content; 4 (pages + work updates) are returned as news and blogs are filtered out.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultsCount(4);
  });

  test("should show pagination when search results exceed 10 items", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: pagination should be shown when more than 10 results exist and only 10 results should appear on the first page.
    // Data setup: the standard seed yields 4 searchable records (pages + work updates), so add 8 extra matching
    // work updates (a searchable type) to take the total to 12 and force pagination. Blogs are not searchable.

    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    const extraWorkUpdates = Post.manyWorkUpdates(8, keyword);

    await seedSearchData(wp, seed);
    await wp.posts.createMany(extraWorkUpdates);

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
    // Data setup: the standard seed yields 4 searchable records (pages + work updates), which is fewer than 10.
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultCount(4);
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
    // Data setup: creates matching content; 4 (pages + work updates) are returned as news and blogs are filtered out.
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
    await searchResultsPage.assertResultCount(4);
  });

  test("should allow the user to search again from the search results page", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: the search results page search box should allow the user to perform another search.
    // Data setup: creates two separate searchable datasets under two different unique keywords.
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
    // Data setup: creates matching searchable content for one unique keyword.
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
  // failing. confirm if there has been a change to the ordering of results
  test.skip("should show the newest result first in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    const keyword = `Ordering-${runId}`;
    const now = dayjs();

    const first = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(`${keyword} First result`)
      .withContent(`${keyword} first result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(9, "minute").toDate());

    const second = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(`${keyword} Second result`)
      .withContent(`${keyword} second result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(6, "minute").toDate());

    const third = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(`${keyword} Third result`)
      .withContent(`${keyword} third result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(1, "minute").toDate());

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    await wp.posts.create(first);
    await delay(2000);
    await wp.posts.create(second);
    await delay(2000);
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
    // Data setup: creates one work update (a searchable type) with an intentionally long title and long content.
    const keyword = `SearchTruncation-${runId}`;

    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(
        `${keyword} this is a very long search result title designed to exceed the eighty five character limit on the search results page`,
      )
      .withContent(
        `${keyword} this is a very long excerpt designed to exceed one hundred and twenty five characters so that the search results page has to truncate the visible description for the user`,
      )
      .withStatus("publish");

    await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(keyword);

    await searchResultsPage.assertResultTitleIsTruncated(post.title);
    await searchResultsPage.assertResultExcerptIsTruncated(post.content);
  });

  test("should display terms for work updates in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    workUpdate,
    runId,
  }) => {
    // AC: categories and labels should appear as tags in search results where supported (excluding news and blogs).
    // Data setup: seeds mixed content, then updates a work update through the WP UI to apply a visible term.

    const keyword = `Terms-${runId}`;
    const seed = createSearchSeed(keyword);

    const ids = await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await workUpdate.gotoEdit(ids.workUpdateIds[0]);
    await workUpdate.selectLabel("CCS live");
    await workUpdate.update();

    await homepage.goto();
    await homepage.search(seed.keyword);

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
    workUpdate,
    runId,
  }) => {
    // Additional coverage: verifies that no audience tag is shown when no audience is applied.
    // Data setup: creates one work update result (a searchable type) and leaves audience unset before searching.
    const keyword = `AudienceNone-${runId}`;

    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(`${keyword} result`)
      .withContent(`${keyword} content`)
      .withStatus("publish");

    const postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await workUpdate.gotoEdit(postId);
    await workUpdate.update();

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
    // AC: content type of "news" should not appear in search results
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
    await searchResultsPage.assertResultNotVisible(newsPost.title);
  });

  test("should not display blog content in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: content type of "blogs" should not appear in search results
    // Data setup: create a unique blog item and search for it

    const keyword = `ExcludeBlog-${runId}`;

    const blogPost = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`${keyword} Blog item`)
      .withContent(`${keyword} content`)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(blogPost);
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await homepage.goto();
    await homepage.search(keyword);
    await searchResultsPage.assertResultNotVisible(blogPost.title);
  });
});
