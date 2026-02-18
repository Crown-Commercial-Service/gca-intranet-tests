import { test as base } from "@playwright/test";
import { wp as runWp } from "../src/utils/wpCli";
import {
  expectUserToExist,
  expectUserToHaveRole,
} from "../src/assertions/wpUserAssertions";
import type User from "../src/models/User";
import WpUsers from "../src/helpers/WpUsers";
import WpThemes from "../src/helpers/WpThemes";
import WpPosts from "./helpers/WpPosts";
import HomePage from "../src/pages/HomePage";

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
  runId: string;
};

const PARALLEL_PORTS = [8080, 8081, 8082, 8083];
const DEFAULT_THEME = "gca-intranet";
const STACK_COUNT = PARALLEL_PORTS.length;

function isParallelLocalRun(): boolean {
  return (
    process.env.PARALLEL_LOCAL === "true" ||
    process.env.WP_PARALLEL === "true" ||
    process.env.WP_STACK === "parallel"
  );
}

function stackIndexForWorker(workerIndex: number): number {
  return workerIndex % STACK_COUNT;
}

function wpServiceName(workerIndex: number): string {
  if (!isParallelLocalRun()) return process.env.WP_SERVICE ?? "wordpress";
  return `wordpress${stackIndexForWorker(workerIndex)}`;
}

function baseUrlForWorker(workerIndex: number): string | undefined {
  if (!isParallelLocalRun()) return undefined;
  const port =
    PARALLEL_PORTS[stackIndexForWorker(workerIndex)] ?? PARALLEL_PORTS[0];
  return `http://localhost:${port}`;
}

export const test = base.extend<Fixtures>({
  runId: async ({}, use, testInfo) => {
    const runId = `run-${testInfo.workerIndex}-${Date.now()}`;
    process.env.PW_RUN_ID = runId;
    await use(runId);
  },

  wp: async ({}, use, testInfo) => {
    const service = wpServiceName(testInfo.workerIndex);

    process.env.WP_SERVICE = service;

    const exec: typeof runWp = (args, options) =>
      runWp(args, { ...(options ?? {}), service });

    const helpers: WpHelpers = {
      exec,
      users: new WpUsers(exec),
      themes: new WpThemes(exec),
      posts: new WpPosts(exec),
      expectUserToExist,
      expectUserToHaveRole,
    };

    await helpers.themes.activate(process.env.WP_THEME || DEFAULT_THEME);

    await use(helpers);
  },

  homepage: async ({ page }, use, testInfo) => {
    const homepage = new HomePage(page, baseUrlForWorker(testInfo.workerIndex));
    await use(homepage);
  },
});

export const expect = test.expect;

test.beforeEach(async ({ wp, runId }) => {
  await wp.posts.clearByRunId(runId);
});
