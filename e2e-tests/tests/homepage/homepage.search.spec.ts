import { test, expect } from "../../src/wp.fixtures";
import { createSearchSeed } from "../../src/models/SearchSeed";
import { seedSearchData } from "../../src/helpers/SearchHelper";
import Post from "../../src/models/Post";
import dayjs from "dayjs";

test.describe("search", () => {
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

  test("should render the search results page for mixed content", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: search from header opens results page and shows mixed content results with heading, count and search box
    // Data setup: seed 8 unique results across pages, news, blogs and work updates using runId keyword
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
    await searchResultsPage.assertResultCount(8);
  });

  test("should display the correct result format for each content type", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: each result should show content type, title link and description
    // Data setup: seed one searchable page, news post, blog and work update under the same unique keyword
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

    await searchResultsPage.assertResultHasType(seed.news[0].title, "News");
    await searchResultsPage.assertResultHasLink(seed.news[0].title);
    await searchResultsPage.assertResultHasExcerpt(seed.news[0].title);

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

  test("should show the correct total results count", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: results page should show total number of returned results
    // Data setup: seed 8 unique searchable records for one keyword
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultsCount(8);
  });

  test("should paginate when more than 10 results exist", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: pagination should show when results exceed 10 and page should only show 10 results
    // Data setup: seed the standard 8 results and add 8 more matching items to exceed the first-page limit
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    const extraNews = Post.manyNews(4, keyword);
    const extraBlogs = Post.manyBlogs(4, keyword);

    await seedSearchData(wp, seed);
    await wp.posts.createMany(extraNews);
    await wp.posts.createMany(extraBlogs);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultCount(10);
    await searchResultsPage.assertPaginationVisible();
  });

  test("should not show pagination when 10 or fewer results exist", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: pagination should not show when there are 10 or fewer results
    // Data setup: seed only the standard 8 searchable records
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultCount(8);
    await searchResultsPage.assertPaginationNotVisible();
  });

  test("should display a no results state for an unmatched term", async ({
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: no-results state should show searched term and allow user to search again
    // Data setup: no content is created; unique runId term guarantees zero matches
    const query = `NoMatch-${runId}`;

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await homepage.goto();
    await homepage.search(query);

    await searchResultsPage.assertHeadingContainsQuery(query);
    await searchResultsPage.assertSearchInputVisible();
    await searchResultsPage.assertNoResultsMessageVisible(query);
  });

  test("should allow searching by pressing Enter from the homepage header", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: user can search from header and submit with Enter
    // Data setup: seed 8 unique searchable records for one keyword
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
    await searchResultsPage.assertResultCount(8);
  });

  test("should allow searching again from the search results page", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: user can search again from the results page search box
    // Data setup: seed two separate 8-result datasets with different unique keywords
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

  test("should hide the header search and show the search results page search box", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: search box should move from header to results page
    // Data setup: seed 8 unique searchable records for one keyword
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

  test("should show newest search results first", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // Additional coverage: verify ordering of results so newest items appear first
    // Data setup: create 3 news posts with explicit createdAt timestamps one minute apart
    const keyword = `Ordering-${runId}`;
    const now = dayjs();

    const first = Post.aPost()
      .withType("news")
      .withFixedTitle(`${keyword} First result`)
      .withContent(`${keyword} first result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(3, "minute").toDate())
      .withFeaturedImage("featured.jpg");

    const second = Post.aPost()
      .withType("news")
      .withFixedTitle(`${keyword} Second result`)
      .withContent(`${keyword} second result content`)
      .withStatus("publish")
      .withCreatedAt(now.subtract(2, "minute").toDate())
      .withFeaturedImage("featured.jpg");

    const third = Post.aPost()
      .withType("news")
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

    await searchResultsPage.assertResultsInOrder([
      third.title,
      second.title,
      first.title,
    ]);
  });

  test("should truncate result title and description", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    // AC: result title and description should be truncated to fit the design
    // Data setup: create one news post with an intentionally long title and long content
    const keyword = `SearchTruncation-${runId}`;

    const post = Post.aPost()
      .withType("news")
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

  test("should display search result terms for news, blogs and work updates", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    latestNews,
    blog,
    workUpdate,
    runId,
  }) => {
    const keyword = `Terms-${runId}`;
    const seed = createSearchSeed(keyword);

    const ids = await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await latestNews.gotoEdit(ids.newsIds[0]);
    await latestNews.selectCategory("Information security");
    await latestNews.update();

    await blog.gotoEdit(ids.blogIds[0]);
    await blog.selectLabel("Reward");
    await blog.update();

    await workUpdate.gotoEdit(ids.workUpdateIds[0]);
    await workUpdate.selectLabel("CCS live");
    await workUpdate.update();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultHasTerm(
      seed.news[0].title,
      "Information security",
    );
    await searchResultsPage.assertResultHasTerm(seed.blogs[0].title, "Reward");
    await searchResultsPage.assertResultHasTerm(
      seed.workUpdates[0].title,
      "CCS live",
    );
  });

  test("should not display an audience tag when no audience is selected", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    blog,
    runId,
  }) => {
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

  test("should not display an audience tag when audience is All colleagues", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
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

  test("should display page results using the page content type label", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    latestNews,
    blog,
    workUpdate,
    runId,
  }) => {
    // AC: page results should render with their page content type label and normal search result structure
    // Data setup: seed mixed content and then search for the unique keyword
    const keyword = `Guidance-${runId}`;
    const seed = createSearchSeed(keyword);
    const ids = await seedSearchData(wp, seed);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await latestNews.gotoEdit(ids.newsIds[0]);
    await latestNews.selectCategory("Information security");
    await latestNews.update();

    await blog.gotoEdit(ids.blogIds[0]);
    await blog.selectLabel("Reward");
    await blog.update();

    await workUpdate.gotoEdit(ids.workUpdateIds[0]);
    await workUpdate.selectLabel("CCS live");
    await workUpdate.update();

    await homepage.goto();
    await homepage.search(seed.keyword);

    await searchResultsPage.assertResultHasType(seed.pages[0].title, "Page");
    await searchResultsPage.assertResultHasLink(seed.pages[0].title);
    await searchResultsPage.assertResultHasExcerpt(seed.pages[0].title);
  });

  test("should display selected content type for a page in search results", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    const keyword = `PageCategory-${runId}`;

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

  test("should display Page as the content type when no content type is selected", async ({
    wp,
    homepage,
    searchResultsPage,
    wordpressLoginPage,
    runId,
  }) => {
    const keyword = `PageCategory-${runId}`;

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
});

// import { test, expect } from "../../src/wp.fixtures";
// import { createSearchSeed } from "../../src/models/SearchSeed";
// import { seedSearchData } from "../../src/helpers/SearchHelper";
// import Post from "../../src/models/Post";
// import dayjs from "dayjs";

// test.describe("search", () => {
//   test.beforeEach(async ({ wp }) => {
//     await wp.posts.clearByTypeAndAuthor("page");
//     await wp.posts.clearByTypeAndAuthor("news");
//     await wp.posts.clearByTypeAndAuthor("blogs");
//     await wp.posts.clearByTypeAndAuthor("work_updates");
//   });

//   test.afterAll(async ({ wp }) => {
//     await wp.posts.clearByTypeAndAuthor("page");
//     await wp.posts.clearByTypeAndAuthor("news");
//     await wp.posts.clearByTypeAndAuthor("blogs");
//     await wp.posts.clearByTypeAndAuthor("work_updates");
//   });

//   test("should render the search results page for mixed content", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();
//     await homepage.goto();

//     await homepage.search(seed.keyword);
//     await searchResultsPage.assertHeadingContainsQuery(seed.keyword);
//     await searchResultsPage.assertSearchInputVisible();
//     await searchResultsPage.assertResultsCountVisible();
//     await searchResultsPage.assertResultCount(8);
//   });

//   test("should display the correct result format for each content type", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();
//     await homepage.goto();

//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertResultHasType(seed.pages[0].title, "Page");
//     await searchResultsPage.assertResultHasLink(seed.pages[0].title);
//     await searchResultsPage.assertResultHasExcerpt(seed.pages[0].title);

//     await searchResultsPage.assertResultHasType(seed.news[0].title, "News");
//     await searchResultsPage.assertResultHasLink(seed.news[0].title);
//     await searchResultsPage.assertResultHasExcerpt(seed.news[0].title);

//     await searchResultsPage.assertResultHasType(seed.blogs[0].title, "Blog");
//     await searchResultsPage.assertResultHasLink(seed.blogs[0].title);
//     await searchResultsPage.assertResultHasExcerpt(seed.blogs[0].title);

//     await searchResultsPage.assertResultHasType(
//       seed.workUpdates[0].title,
//       "Work Update",
//     );
//     await searchResultsPage.assertResultHasLink(seed.workUpdates[0].title);
//     await searchResultsPage.assertResultHasExcerpt(seed.workUpdates[0].title);
//   });

//   test("should show the correct total results count", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertResultsCount(8);
//   });

//   test("should paginate when more than 10 results exist", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     // Add extra results to exceed 10
//     const extraNews = Post.manyNews(4, keyword);
//     const extraBlogs = Post.manyBlogs(4, keyword);

//     await seedSearchData(wp, seed);
//     await wp.posts.createMany(extraNews);
//     await wp.posts.createMany(extraBlogs);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertResultCount(10);
//     await searchResultsPage.assertPaginationVisible();
//   });

//   test("should not show pagination when 10 or fewer results exist", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertResultCount(8);
//     await searchResultsPage.assertPaginationNotVisible();
//   });

//   test("should display a no results state for an unmatched term", async ({
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const query = `NoMatch-${runId}`;

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(query);

//     await searchResultsPage.assertHeadingContainsQuery(query);
//     await searchResultsPage.assertSearchInputVisible();
//     await searchResultsPage.assertNoResultsMessageVisible(query);
//   });

//   test("should allow searching by pressing Enter from the homepage header", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.searchWithEnter(seed.keyword);

//     await searchResultsPage.assertHeadingContainsQuery(seed.keyword);
//     await searchResultsPage.assertSearchInputVisible();
//     await searchResultsPage.assertResultsCountVisible();
//     await searchResultsPage.assertResultCount(8);
//   });

//   test("should allow searching again from the search results page", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const firstKeyword = `Procurement-${runId}`;
//     const secondKeyword = `Governance-${runId}`;

//     const firstSeed = createSearchSeed(firstKeyword);
//     const secondSeed = createSearchSeed(secondKeyword);

//     await seedSearchData(wp, firstSeed);
//     await seedSearchData(wp, secondSeed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(firstSeed.keyword);

//     await searchResultsPage.assertHeadingContainsQuery(firstSeed.keyword);
//     await searchResultsPage.search(secondSeed.keyword);

//     await searchResultsPage.assertHeadingContainsQuery(secondSeed.keyword);
//     await searchResultsPage.assertSearchInputValue(secondSeed.keyword);
//     await searchResultsPage.assertResultsCountVisible();
//   });

//   test("should hide the header search and show the search results page search box", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Procurement-${runId}`;
//     const seed = createSearchSeed(keyword);

//     await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertSearchInputVisible();
//     await homepage.assertHeaderSearchNotVisible();
//   });

//   test("should show newest search results first", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `Ordering-${runId}`;
//     const now = dayjs();
//     const first = Post.aPost()
//       .withType("news")
//       .withFixedTitle(`${keyword} First result`)
//       .withContent(`${keyword} first result content`)
//       .withStatus("publish")
//       .withCreatedAt(now.subtract(3, "minute").toDate())
//       .withFeaturedImage("featured.jpg");

//     const second = Post.aPost()
//       .withType("news")
//       .withFixedTitle(`${keyword} Second result`)
//       .withContent(`${keyword} second result content`)
//       .withStatus("publish")
//       .withCreatedAt(now.subtract(2, "minute").toDate())
//       .withFeaturedImage("featured.jpg");

//     const third = Post.aPost()
//       .withType("news")
//       .withFixedTitle(`${keyword} Third result`)
//       .withContent(`${keyword} third result content`)
//       .withStatus("publish")
//       .withCreatedAt(now.subtract(1, "minute").toDate())
//       .withFeaturedImage("featured.jpg");

//     await wp.posts.create(first);
//     await wp.posts.create(second);
//     await wp.posts.create(third);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(keyword);
//     await searchResultsPage.assertResultsInOrder([
//       third.title,
//       second.title,
//       first.title,
//     ]);
//   });

//   test("should truncate result title and description", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `SearchTruncation-${runId}`;

//     const post = Post.aPost()
//       .withType("news")
//       .withFixedTitle(
//         `${keyword} this is a very long search result title designed to exceed the eighty five character limit on the search results page`,
//       )
//       .withContent(
//         `${keyword} this is a very long excerpt designed to exceed one hundred and twenty five characters so that the search results page has to truncate the visible description for the user`,
//       )
//       .withStatus("publish")
//       .withFeaturedImage("featured.jpg");

//     await wp.posts.create(post);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(keyword);

//     await searchResultsPage.assertResultTitleIsTruncated(post.title);
//     await searchResultsPage.assertResultExcerptIsTruncated(post.content);
//   });

//   test("should display categories or terms for each result", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     latestNews,
//     blog,
//     workUpdate,
//     runId,
//   }) => {
//     const keyword = `Terms-${runId}`;
//     const seed = createSearchSeed(keyword);

//     const ids = await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await latestNews.gotoEdit(ids.newsIds[0]);
//     await latestNews.selectCategory("Information security");
//     await latestNews.update();

//     await blog.gotoEdit(ids.blogIds[0]);
//     await blog.selectLabel("Reward");
//     await blog.update();

//     await workUpdate.gotoEdit(ids.workUpdateIds[0]);
//     await workUpdate.selectLabel("CCS live");
//     await workUpdate.update();

//     await homepage.goto();
//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertResultHasTerm(
//       seed.news[0].title,
//       "Information security",
//     );

//     await searchResultsPage.assertResultHasTerm(seed.blogs[0].title, "Reward");

//     await searchResultsPage.assertResultHasTerm(
//       seed.workUpdates[0].title,
//       "CCS live",
//     );
//   });

//   test("should display page results using the page content type label", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     latestNews,
//     blog,
//     workUpdate,
//     runId,
//   }) => {
//     const keyword = `Guidance-${runId}`;
//     const seed = createSearchSeed(keyword);
//     const ids = await seedSearchData(wp, seed);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await latestNews.gotoEdit(ids.newsIds[0]);
//     await latestNews.selectCategory("Information security");
//     await latestNews.update();

//     await blog.gotoEdit(ids.blogIds[0]);
//     await blog.selectLabel("Reward");
//     await blog.update();

//     await workUpdate.gotoEdit(ids.workUpdateIds[0]);
//     await workUpdate.selectLabel("CCS live");
//     await workUpdate.update();

//     await homepage.goto();
//     await homepage.search(seed.keyword);

//     await searchResultsPage.assertResultHasType(seed.pages[0].title, "Page");
//     await searchResultsPage.assertResultHasLink(seed.pages[0].title);
//     await searchResultsPage.assertResultHasExcerpt(seed.pages[0].title);
//   });

//   test("should display page category as content type in search results", async ({
//     wp,
//     homepage,
//     searchResultsPage,
//     wordpressLoginPage,
//     runId,
//   }) => {
//     const keyword = `PageCategory-${runId}`;

//     const page = Post.aPage()
//       .withFixedTitle(`${keyword} Policy Hub`)
//       .withContent(`${keyword} guidance and support`)
//       .withStatus("publish");

//     await wp.posts.create(page);

//     await wordpressLoginPage.goto();
//     await wordpressLoginPage.loginAsAdmin();

//     await homepage.goto();
//     await homepage.search(keyword);

//     await searchResultsPage.assertResultHasType(page.title, "Page");
//     await searchResultsPage.assertResultHasLink(page.title);
//     await searchResultsPage.assertResultHasExcerpt(page.title);
//   });
// });
