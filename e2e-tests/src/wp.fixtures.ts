import { test as base } from "@playwright/test";
import { wp as runWp } from "../src/utils/wpCli";

type CreateUserArgs = {
  username: string;
  password: string;
  role?: string;
  email?: string;
};

type WpHelpers = {
  exec: typeof runWp;
  createUser: (args: CreateUserArgs) => Promise<void>;
  updateUserPassword: (username: string, password: string) => Promise<void>;
  userExists: (username: string) => Promise<boolean>;
  upsertUser: (args: CreateUserArgs) => Promise<void>;
};

type Fixtures = {
  wp: WpHelpers;
};

export const test = base.extend<Fixtures>({
  wp: async ({}, use) => {
    const helpers: WpHelpers = {
      exec: runWp,

      async userExists(username: string) {
        const res = await runWp(["user", "get", username, "--field=ID"]);
        return res.exitCode === 0 && !!res.stdout.trim();
      },

      async createUser({
        username,
        password,
        role = "administrator",
        email,
      }: CreateUserArgs) {
        const exists = await helpers.userExists(username);
        if (exists) {
          throw new Error(`User "${username}" already exists`);
        }

        const userEmail = email ?? `${username}@example.com`;

        await runWp([
          "user",
          "create",
          username,
          userEmail,
          `--role=${role}`,
          `--user_pass=${password}`,
        ]);
      },

      async updateUserPassword(username: string, password: string) {
        const exists = await helpers.userExists(username);
        if (!exists) {
          throw new Error(
            `Cannot update password. User "${username}" does not exist`,
          );
        }

        await runWp(["user", "update", username, `--user_pass=${password}`]);
      },

      async upsertUser({
        username,
        password,
        role = "administrator",
        email,
      }: CreateUserArgs) {
        const exists = await helpers.userExists(username);
        if (exists) {
          await runWp(["user", "update", username, `--user_pass=${password}`]);

          // Optional: keep role in sync too
          await runWp(["user", "set-role", username, role]);

          // Optional: keep email in sync if provided
          if (email) {
            await runWp(["user", "update", username, `--user_email=${email}`]);
          }
          return;
        }

        const userEmail = email ?? `${username}@example.com`;

        await runWp([
          "user",
          "create",
          username,
          userEmail,
          `--role=${role}`,
          `--user_pass=${password}`,
        ]);
      },
    };

    await use(helpers);
  },
});

export const expect = test.expect;
