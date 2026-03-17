import { test, expect } from "../../src/wp.fixtures";
import { createSearchSeed } from "../../src/models/SearchSeed";
import { seedSearchData } from "../../src/helpers/SearchHelper";

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
    searchResultsPage,
    runId,
  }) => {
    const keyword = `Procurement-${runId}`;
    const seed = createSearchSeed(keyword);
    await seedSearchData(wp, seed);

    await searchResultsPage.goto(seed.keyword);

    await searchResultsPage.assertHeadingContainsQuery(seed.keyword);
    await searchResultsPage.assertSearchInputVisible();
    await searchResultsPage.assertResultsCountVisible();
    await searchResultsPage.assertResultCount(8);
  });

  //   test("should display the correct result format for each content type", async ({
  //     wp,
  //     searchResultsPage,
  //   }) => {
  //     const seed = createSearchSeed("Procurement");
  //     await seedSearchData(wp, seed);

  //     await searchResultsPage.goto(seed.keyword);

  //     const pageResult = page
  //       .getByTestId("search-result")
  //       .filter({
  //         has: page.getByRole("link", { name: seed.pages[0].title }),
  //       })
  //       .first();

  //     const newsResult = page
  //       .getByTestId("search-result")
  //       .filter({
  //         has: page.getByRole("link", { name: seed.news[0].title }),
  //       })
  //       .first();

  //     const blogResult = page
  //       .getByTestId("search-result")
  //       .filter({
  //         has: page.getByRole("link", { name: seed.blogs[0].title }),
  //       })
  //       .first();

  //     const workUpdateResult = page
  //       .getByTestId("search-result")
  //       .filter({
  //         has: page.getByRole("link", { name: seed.workUpdates[0].title }),
  //       })
  //       .first();

  //     await expect(pageResult.getByTestId("search-result-type")).toBeVisible();
  //     await expect(
  //       pageResult.getByRole("link", { name: seed.pages[0].title }),
  //     ).toBeVisible();
  //     await expect(
  //       pageResult.getByTestId("search-result-description"),
  //     ).toBeVisible();

  //     await expect(newsResult.getByTestId("search-result-type")).toContainText(
  //       "News",
  //     );
  //     await expect(
  //       newsResult.getByRole("link", { name: seed.news[0].title }),
  //     ).toBeVisible();
  //     await expect(
  //       newsResult.getByTestId("search-result-description"),
  //     ).toBeVisible();

  //     await expect(blogResult.getByTestId("search-result-type")).toContainText(
  //       "Blog",
  //     );
  //     await expect(
  //       blogResult.getByRole("link", { name: seed.blogs[0].title }),
  //     ).toBeVisible();
  //     await expect(
  //       blogResult.getByTestId("search-result-description"),
  //     ).toBeVisible();

  //     await expect(
  //       workUpdateResult.getByTestId("search-result-type"),
  //     ).toContainText("Work update");
  //     await expect(
  //       workUpdateResult.getByRole("link", { name: seed.workUpdates[0].title }),
  //     ).toBeVisible();
  //     await expect(
  //       workUpdateResult.getByTestId("search-result-description"),
  //     ).toBeVisible();
  //   });

  //   test("should show the correct total results count", async ({
  //     wp,
  //     searchResultsPage,
  //   }) => {
  //     const seed = createSearchSeed("Procurement");
  //     await seedSearchData(wp, seed);

  //     await searchResultsPage.goto(seed.keyword);

  //     await expect(page.getByTestId("search-results-count")).toContainText("8");
  //   });

  //   test("should paginate when more than 10 results exist", async ({
  //     wp,
  //     searchResultsPage,
  //   }) => {
  //     const keyword = "Procurement";
  //     const pages = [
  //       Post.aPage()
  //         .withFixedTitle(`${keyword} Policy Hub`)
  //         .withContent(`${keyword} policy and guidance content.`)
  //         .withStatus("publish"),
  //     ];

  //     const news = Post.manyNews(4, `${keyword} News`);
  //     const blogs = Post.manyBlogs(4, `${keyword} Blog`);
  //     const workUpdates = Post.manyWorkUpdates(4, `${keyword} Work Update`);

  //     await wp.posts.createPages(pages);
  //     await wp.posts.createMany(news);
  //     await wp.posts.createMany(blogs);
  //     await wp.posts.createMany(workUpdates);

  //     await gotoSearchResults(page, keyword);

  //     await expect(page.getByTestId("search-result")).toHaveCount(10);
  //     await expect(page.locator(".pagination")).toBeVisible();
  //   });

  //   test("should not show pagination when 10 or fewer results exist", async ({
  //     wp,
  //     searchResultsPage,
  //   }) => {
  //     const seed = createSearchSeed("Procurement");
  //     await seedSearchData(wp, seed);

  //     await searchResultsPage.goto(seed.keyword);

  //     await expect(page.getByTestId("search-result")).toHaveCount(8);
  //     await expect(page.locator(".pagination")).not.toBeVisible();
  //   });

  //   test("should display a no results state for an unmatched term", async ({
  //     searchResultsPage,
  //   }) => {
  //     const query = "NoMatchSearchTerm123";

  //     await gotoSearchResults(page, query);

  //     await expect(
  //       page.getByRole("heading", {
  //         name: new RegExp(`Search results for.*${query}`, "i"),
  //       }),
  //     ).toBeVisible();

  //     await expect(page.getByRole("searchbox")).toBeVisible();
  //     await expect(page.getByText(/no results/i)).toBeVisible();
  //     await expect(page.getByTestId("search-results-count")).toContainText("0");
  //   });
});
