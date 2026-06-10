import { test as base } from "@playwright/test";
import {
  expectUserToExist,
  expectUserToHaveRole,
} from "../src/assertions/wpUserAssertions";
import User from "../src/models/User";
import WpUsers from "../src/helpers/WpUsers";
import WpPosts from "./helpers/WpPosts";
import HomePage from "../src/pages/HomePage";
import LatestNews from "../src/pages/LatestNews";
import LatestNewsList from "../src/pages/LatestNewsList";
import WorkUpdate from "../src/pages/WorkUpdate";
import WorkUpdateList from "../src/pages/WorkUpdateList";
import BlogPage from "../src/pages/BlogPage";
import BlogListPage from "../src/pages/BlogListPage";
import WordpressLoginPage from "./pages/WordpressLoginPage";
import CustomizerPage from "../src/pages/CustomizerPage";
import WpEvents from "../src/helpers/WpEvents";
import EventEditorPage from "../src/pages/EventEditorPage";
import EventsListPage from "../src/pages/EventsListPage";
import EventPage from "../src/pages/EventPage";
import ContentPage from "../src/pages/ContentPage";
import SearchResultsPage from "../src/pages/SearchResultsPage";
import StaffDirectoryPage from "../src/pages/StaffDirectoryPage";
import StaffProfilePage from "../src/pages/StaffProfilePage";

type WpHelpers = {
  users: WpUsers;
  posts: WpPosts;
  events: WpEvents;

  expectUserToExist: (user: User) => Promise<void>;
  expectUserToHaveRole: (user: User) => Promise<void>;
};

type Auth = {
  loginAs: (user: { username: string; password: string }) => Promise<void>;
};

type Fixtures = {
  wp: WpHelpers;
  auth: Auth;
  homepage: HomePage;
  eventEditorPage: EventEditorPage;
  wordpressLoginPage: WordpressLoginPage;
  customizerPage: CustomizerPage;

  latestNews: LatestNews;
  latestNewsList: LatestNewsList;
  workUpdate: WorkUpdate;
  workUpdateList: WorkUpdateList;
  blog: BlogPage;
  blogList: BlogListPage;
  eventsListPage: EventsListPage;
  eventPage: EventPage;
  searchResultsPage: SearchResultsPage;
  contentPage: ContentPage;
  staffDirectory: StaffDirectoryPage;
  staffProfile: StaffProfilePage;

  runId: string;
};

function baseUrl(): string | undefined {
  return process.env.PW_BASE_URL;
}

async function loginToQaWordpress(
  page: import("@playwright/test").Page,
): Promise<void> {
  const username = process.env.WP_ADMIN_USERNAME;
  const password = process.env.WP_ADMIN_PASSWORD;
  const url = process.env.PW_BASE_URL;

  expect(username, "WP_ADMIN_USERNAME is not set").toBeTruthy();
  expect(password, "WP_ADMIN_PASSWORD is not set").toBeTruthy();
  expect(url, "PW_BASE_URL is not set").toBeTruthy();

  await page.request.get(`${url}/gcawebadmin`);

  await page.request.post(`${url}/gcawebadmin`, {
    form: {
      log: username!,
      pwd: password!,
      "wp-submit": "Log In",
      redirect_to: `${url}/wp-admin/`,
      testcookie: "1",
    },
  });
}

export const test = base.extend<Fixtures>({
  runId: async ({}, use, testInfo) => {
    const id = `run-${testInfo.workerIndex}-${Date.now()}`;
    process.env.PW_RUN_ID = id;
    await use(id);
  },

  wp: async ({}, use) => {
    const helpers: WpHelpers = {
      users: new WpUsers(),
      posts: new WpPosts(),
      events: new WpEvents(),
      expectUserToExist,
      expectUserToHaveRole,
    };

    await use(helpers);
  },

  homepage: async ({ page }, use) => {
    await loginToQaWordpress(page);
    await use(new HomePage(page, baseUrl()));
  },

  wordpressLoginPage: async ({ page }, use) => {
    await use(new WordpressLoginPage(page));
  },

  auth: async ({ wordpressLoginPage }, use) => {
    await use({
      loginAs: async (user) => {
        await wordpressLoginPage.logout();
        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(user.username, user.password);
      },
    });
  },

  customizerPage: async ({ page }, use) => {
    await use(new CustomizerPage(page));
  },

  eventEditorPage: async ({ page }, use) => {
    await use(new EventEditorPage(page));
  },

  latestNews: async ({ page }, use) => {
    await use(new LatestNews(page, baseUrl()));
  },

  latestNewsList: async ({ page }, use) => {
    await use(new LatestNewsList(page, baseUrl()));
  },

  workUpdate: async ({ page }, use) => {
    await use(new WorkUpdate(page, baseUrl()));
  },

  workUpdateList: async ({ page }, use) => {
    await use(new WorkUpdateList(page, baseUrl()));
  },

  blog: async ({ page }, use) => {
    await use(new BlogPage(page, baseUrl()));
  },

  contentPage: async ({ page }, use) => {
    await use(new ContentPage(page));
  },

  blogList: async ({ page }, use) => {
    await use(new BlogListPage(page));
  },

  eventsListPage: async ({ page }, use) => {
    await use(new EventsListPage(page, baseUrl()));
  },

  eventPage: async ({ page }, use) => {
    await use(new EventPage(page, baseUrl()));
  },

  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page, baseUrl()));
  },

  staffDirectory: async ({ page }, use) => {
    await loginToQaWordpress(page);
    await use(new StaffDirectoryPage(page, baseUrl()));
  },

  staffProfile: async ({ page }, use) => {
    await use(new StaffProfilePage(page, baseUrl()));
  },
});

export const expect = test.expect;
