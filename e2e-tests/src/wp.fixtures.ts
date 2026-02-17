import { test as base } from "@playwright/test";
import { wp as runWp } from "../src/utils/wpCli";
import {
  expectUserToExist,
  expectUserToHaveRole,
} from "../src/assertions/wpUserAssertions";
import User from "../src/models/User";
import WpUsers from "../src/helpers/WpUsers";
import WpThemes from "../src/helpers/WpThemes";

type WpHelpers = {
  exec: typeof runWp;
  users: WpUsers;
  themes: WpThemes;
  expectUserToExist: (user: User) => Promise<void>;
  expectUserToHaveRole: (user: User) => Promise<void>;
};

type Fixtures = {
  wp: WpHelpers;
};

export const test = base.extend<Fixtures>({
  wp: async ({}, use) => {
    const users = new WpUsers(runWp);
    const themes = new WpThemes(runWp);

    const helpers: WpHelpers = {
      exec: runWp,
      users,
      themes,
      expectUserToExist,
      expectUserToHaveRole,
    };

    await themes.activate("gca-intranet");
    await use(helpers);
  },
});

export const expect = test.expect;
