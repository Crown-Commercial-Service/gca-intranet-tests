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
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);

    // Add extra results to exceed 10
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

  test("should display categories or terms for each result", async ({
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
});
