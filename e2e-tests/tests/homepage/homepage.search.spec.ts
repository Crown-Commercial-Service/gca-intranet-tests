// import { test, expect } from "../../src/wp.fixtures";
// import Post from "../../src/models/Post";

// type SearchSeed = {
//   keyword: string;
//   pages: Post[];
//   news: Post[];
//   blogs: Post[];
//   workUpdates: Post[];
//   unrelated: Post[];
// };

// function createSearchSeed(keyword: string): SearchSeed {
//   return {
//     keyword,

//     pages: [
//       Post.aPage()
//         .withFixedTitle(`${keyword} Policy Hub`)
//         .withContent(
//           `${keyword} guidance, policy, templates and support for teams across GCA.`,
//         )
//         .withStatus("publish"),

//       Post.aPage()
//         .withFixedTitle(`${keyword} Training and Guidance`)
//         .withContent(
//           `Training materials and reference content for ${keyword} activity across directorates.`,
//         )
//         .withStatus("publish"),
//     ],

//     news: [
//       Post.aPost()
//         .withType("news")
//         .withFixedTitle(`${keyword} Transformation Update`)
//         .withParagraphMaxChars(120)
//         .withContent(
//           `Latest ${keyword} transformation progress and delivery milestones across GCA.`,
//         )
//         .withStatus("publish")
//         .withFeaturedImage("featured.jpg"),

//       Post.aPost()
//         .withType("news")
//         .withFixedTitle(`${keyword} Digital Delivery Milestone`)
//         .withParagraphMaxChars(120)
//         .withContent(
//           `The latest ${keyword} delivery milestone and implementation update.`,
//         )
//         .withStatus("publish")
//         .withFeaturedImage("featured.jpg"),
//     ],

//     blogs: [
//       Post.aPost()
//         .withType("blogs")
//         .withFixedTitle(
//           `How ${keyword.toLowerCase()} teams improve supplier onboarding`,
//         )
//         .withParagraphMaxChars(120)
//         .withContent(
//           `A blog covering how ${keyword.toLowerCase()} teams can improve supplier onboarding and collaboration.`,
//         )
//         .withStatus("publish")
//         .withFeaturedImage("featured.jpg"),

//       Post.aPost()
//         .withType("blogs")
//         .withFixedTitle(`${keyword} lessons from digital transformation`)
//         .withParagraphMaxChars(120)
//         .withContent(
//           `Lessons learned from recent ${keyword.toLowerCase()} transformation work across the organisation.`,
//         )
//         .withStatus("publish")
//         .withFeaturedImage("featured.jpg"),
//     ],

//     workUpdates: [
//       Post.aPost()
//         .withType("work_updates")
//         .withFixedTitle(`${keyword} workflow improvement`)
//         .withParagraphMaxChars(120)
//         .withContent(
//           `A work update on ${keyword.toLowerCase()} workflow changes and delivery improvements.`,
//         )
//         .withStatus("publish"),

//       Post.aPost()
//         .withType("work_updates")
//         .withFixedTitle(`${keyword} governance progress`)
//         .withParagraphMaxChars(120)
//         .withContent(
//           `Progress update on ${keyword.toLowerCase()} governance and assurance activity.`,
//         )
//         .withStatus("publish"),
//     ],

//     unrelated: [
//       Post.aPage()
//         .withFixedTitle("HR onboarding guide")
//         .withContent("Guidance for HR onboarding and induction.")
//         .withStatus("publish"),

//       Post.aPost()
//         .withType("news")
//         .withFixedTitle("Accessibility support article")
//         .withParagraphMaxChars(120)
//         .withContent("Accessibility support and inclusive design update.")
//         .withStatus("publish")
//         .withFeaturedImage("featured.jpg"),

//       Post.aPost()
//         .withType("blogs")
//         .withFixedTitle("Finance budget reminder")
//         .withParagraphMaxChars(120)
//         .withContent("Finance budget reminder for Q4 planning.")
//         .withStatus("publish")
//         .withFeaturedImage("featured.jpg"),
//     ],
//   };
// }

// async function seedSearchData(wp: any, seed: SearchSeed): Promise<void> {
//   await wp.posts.createPages(seed.pages);
//   await wp.posts.createMany(seed.news);
//   await wp.posts.createMany(seed.blogs);
//   await wp.posts.createMany(seed.workUpdates);
//   await wp.posts.createMany(seed.unrelated);
// }

// async function gotoSearchResults(page: any, query: string): Promise<void> {
//   await page.goto(`/?s=${encodeURIComponent(query)}`, {
//     waitUntil: "networkidle",
//   });
// }

// test.describe("search", () => {
//   test.beforeEach(async ({ wp }) => {
//     await wp.posts.clearByTypeAndAuthor("page");
//     await wp.posts.clearByTypeAndAuthor("news");
//     await wp.posts.clearByTypeAndAuthor("blogs");
//     await wp.posts.clearByTypeAndAuthor("work_updates");
//   });

//   test("should render the search results page for mixed content", async ({
//     wp,
//     page,
//   }) => {
//     const seed = createSearchSeed("Procurement");
//     await seedSearchData(wp, seed);

//     await gotoSearchResults(page, seed.keyword);

//     await expect(
//       page.getByRole("heading", {
//         name: new RegExp(`Search results for.*${seed.keyword}`, "i"),
//       }),
//     ).toBeVisible();

//     await expect(page.getByRole("searchbox")).toBeVisible();
//     await expect(page.getByTestId("search-results-count")).toBeVisible();
//     await expect(page.getByTestId("search-result")).toHaveCount(8);
//   });

//   test("should display the correct result format for each content type", async ({
//     wp,
//     page,
//   }) => {
//     const seed = createSearchSeed("Procurement");
//     await seedSearchData(wp, seed);

//     await gotoSearchResults(page, seed.keyword);

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

//   test("should show the correct total results count", async ({ wp, page }) => {
//     const seed = createSearchSeed("Procurement");
//     await seedSearchData(wp, seed);

//     await gotoSearchResults(page, seed.keyword);

//     await expect(page.getByTestId("search-results-count")).toContainText("8");
//   });

//   test("should paginate when more than 10 results exist", async ({
//     wp,
//     page,
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
//     page,
//   }) => {
//     const seed = createSearchSeed("Procurement");
//     await seedSearchData(wp, seed);

//     await gotoSearchResults(page, seed.keyword);

//     await expect(page.getByTestId("search-result")).toHaveCount(8);
//     await expect(page.locator(".pagination")).not.toBeVisible();
//   });

//   test("should display a no results state for an unmatched term", async ({
//     page,
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
// });
