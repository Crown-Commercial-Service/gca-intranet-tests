import { test as base } from "@playwright/test";
import { execa } from "execa";
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

type WpHelpers = {
  exec: typeof runWp;
  users: WpUsers;
  themes: WpThemes;
  posts: WpPosts;

  expectUserToExist: (user: User) => Promise<void>;
  expectUserToHaveRole: (user: User) => Promise<void>;
};

type Fixtures = {
  wp: WpHelpers;
  homepage: HomePage;

  latestNews: LatestNews;
  latestNewsList: LatestNewsList;
  workUpdate: WorkUpdate;
  workUpdateList: WorkUpdateList;

  runId: string;
};

const PARALLEL_STACK_COUNT = 4;

function isQaMode(): boolean {
  return Boolean(process.env.PW_BASE_URL);
}

function workerStackIndex(workerIndex: number): number {
  return workerIndex % PARALLEL_STACK_COUNT;
}

let parallelEnabledPromise: Promise<boolean> | undefined;

async function isParallelEnabled(): Promise<boolean> {
  if (parallelEnabledPromise) return parallelEnabledPromise;

  parallelEnabledPromise = (async () => {
    const composeCwd = process.env.WP_DOCKER_CWD;
    if (!composeCwd) return false;

    try {
      const envFile = process.env.WP_ENV_FILE || ".env";

      const result = await execa(
        "docker",
        [
          "compose",
          "--env-file",
          envFile,
          "-f",
          "docker-compose.parallel.local.yml",
          "config",
          "--services",
        ],
        { cwd: composeCwd, timeout: 30_000 },
      );

      const services = (result.stdout || "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);

      return services.includes("wordpress0") && services.includes("wordpress3");
    } catch {
      return false;
    }
  })();

  return parallelEnabledPromise;
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

  wp: async ({ runId }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();

    process.env.PARALLEL_LOCAL = parallel ? "true" : "false";

    const service = qaMode
      ? (process.env.WP_SERVICE ?? "wordpress")
      : wpServiceForWorker(testInfo.workerIndex, parallel);

    process.env.WP_SERVICE = service;

    const exec: typeof runWp = (args: string[], opts?: any) =>
      runWp(args, { ...(opts ?? {}), service });

    const users = new WpUsers(exec);
    const themes = new WpThemes(exec);
    const posts = new WpPosts(exec);

    const helpers: WpHelpers = {
      exec,
      users,
      themes,
      posts,
      expectUserToExist,
      expectUserToHaveRole,
    };

    if (!qaMode) {
      await themes.activate(process.env.WP_THEME || "gca-intranet");
    }

    await use(helpers);
  },

  homepage: async ({ page }, use, testInfo) => {
    const qaMode = isQaMode();
    const parallel = qaMode ? false : await isParallelEnabled();
    const baseUrl = baseUrlForWorker(testInfo.workerIndex, parallel);

    await use(new HomePage(page, baseUrl));
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
});

export const expect = test.expect;

test.beforeEach(async ({ wp, runId }) => {
  await wp.posts.clearByRunId(runId);
});
