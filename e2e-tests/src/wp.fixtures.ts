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
};

export const test = base.extend<Fixtures>({
  wp: async ({}, use) => {
    const users = new WpUsers(runWp);
    const themes = new WpThemes(runWp);
    const posts = new WpPosts(runWp);

    const helpers: WpHelpers = {
      exec: runWp,
      users,
      themes,
      posts,
      expectUserToExist,
      expectUserToHaveRole,
    };

    await themes.activate("gca-intranet");

    await use(helpers);
  },

  homepage: async ({ page }, use) => {
    const home = new HomePage(page);
    await use(home);
  },
});

export const expect = test.expect;

test.beforeEach(async ({ wp }) => {
  await wp.posts.clearAll();
});
