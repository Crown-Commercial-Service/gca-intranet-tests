import { test as base } from "@playwright/test";
import { wp as runWp } from "../src/utils/wpCli";
import {
  expectUserToExist,
  expectUserToHaveRole,
} from "../src/assertions/wpUserAssertions";
import User from "../src/models/User";
import WpUsers from "../src/helpers/WpUsers";
import WpThemes from "../src/helpers/WpThemes";
import WpPosts from "./helpers/WpPosts";
import HomePage from "../src/pages/HomePage";
import LatestNews from "../src/pages/LatestNews";
import LatestNewsList from "../src/pages/LatestNewsList";
import WorkUpdate from "../src/pages/WorkUpdate";
import WorkUpdateList from "../src/pages/WorkUpdateList";
import BlogPage from "../src/pages/BlogPage";
import BlogListPage from "../src/pages/BlogListPage";
import WpCustomizer from "../src/helpers/WpCustomizer";
import WordpressLoginPage from "./pages/WordpressLoginPage";
import CustomizerPage from "../src/pages/CustomizerPage";
import logger from "../src/utils/logger";

type WpHelpers = {
  exec: typeof runWp;
  users: WpUsers;
  themes: WpThemes;
  posts: WpPosts;
  customizer: WpCustomizer;

  expectUserToExist: (user: User) => Promise<void>;
  expectUserToHaveRole: (user: User) => Promise<void>;
};

type Fixtures = {
  wp: WpHelpers;
  homepage: HomePage;
  wordpressLoginPage: WordpressLoginPage;
  customizerPage: CustomizerPage;

  latestNews: LatestNews;
  latestNewsList: LatestNewsList;
  workUpdate: WorkUpdate;
  workUpdateList: WorkUpdateList;
  blog: BlogPage;
  blogList: BlogListPage;

  runId: string;
};

const PARALLEL_STACK_COUNT = 4;

function isQaMode(): boolean {
  // QA mode = we're using the remote WP driver (REST against qa.intranet...)
  const driver = (process.env.WP_DRIVER || "").toLowerCase().trim();
  return driver === "remote" || process.env.WP_REMOTE === "true";
}

function workerStackIndex(workerIndex: number): number {
  return workerIndex % PARALLEL_STACK_COUNT;
}

let parallelEnabledPromise: Promise<boolean> | undefined;

async function isParallelEnabled(): Promise<boolean> {
  return false;
}

function wpServiceForWorker(workerIndex: number, parallel: boolean): string {
  if (parallel) return `wordpress${workerStackIndex(workerIndex)}`;
  return process.env.WP_SERVICE ?? "wordpress";
}

function baseUrlForWorker(
  workerIndex: number,
  parallel: boolean,
): string | undefined {
  if (isQaMode()) return process.env.PW_BASE_URL;

  if (!parallel) return undefined;

  const idx = workerStackIndex(workerIndex);
  const inDocker = process.env.PW_IN_DOCKER === "true";

  if (inDocker) return `http://wordpress${idx}:8080`;
  return `http://localhost:${8080 + idx}`;
}

export const test = base.extend<Fixtures>({
  runId: async ({}, use, testInfo) => {
    const id = `run-${testInfo.workerIndex}-${Date.now()}`;
    process.env.PW_RUN_ID = id;
    await use(id);
  },

  wp: async ({}, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();

    process.env.PARALLEL_LOCAL = parallel ? "true" : "false";

    const service = qaMode
      ? (process.env.WP_SERVICE ?? "wordpress")
      : wpServiceForWorker(testInfo.workerIndex, parallel);

    process.env.WP_SERVICE = service;

    // logger.info(
    //   {
    //     qaMode,
    //     parallel,
    //     service,
    //     baseUrl: process.env.PW_BASE_URL,
    //     wpDriver: process.env.WP_DRIVER,
    //   },
    //   "Initialising WordPress test helpers",
    // );

    const exec: typeof runWp = (args: string[], opts?: any) =>
      runWp(args, { ...(opts ?? {}), service });

    const users = new WpUsers(exec);
    const themes = new WpThemes(exec);
    const posts = new WpPosts(exec);
    const customizer = new WpCustomizer(exec);

    const helpers: WpHelpers = {
      exec,
      users,
      themes,
      posts,
      customizer,
      expectUserToExist,
      expectUserToHaveRole,
    };

    await use(helpers);
  },

  homepage: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new HomePage(page, baseUrl));
  },

  wordpressLoginPage: async ({ page }, use) => {
    await use(new WordpressLoginPage(page));
  },

  customizerPage: async ({ page }, use) => {
    await use(new CustomizerPage(page));
  },

  latestNews: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new LatestNews(page, baseUrl));
  },

  latestNewsList: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new LatestNewsList(page, baseUrl));
  },

  workUpdate: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new WorkUpdate(page, baseUrl));
  },

  workUpdateList: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new WorkUpdateList(page, baseUrl));
  },

  blog: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new BlogPage(page, baseUrl));
  },

  blogList: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new BlogListPage(page, baseUrl));
  },
});

export const expect = test.expect;
