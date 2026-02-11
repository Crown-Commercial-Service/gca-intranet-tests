import { expect } from "@playwright/test";
import { wp as runWp } from "../utils/wpCli";
import User from "../models/User";

export async function expectUserToExist(user: User) {
  const res = await runWp(["user", "get", user.username, "--field=user_login"]);

  expect(res.exitCode, `User ${user.username} should exist`).toBe(0);
  expect(res.stdout.trim()).toBe(user.username);
}

export async function expectUserToHaveRole(user: User) {
  const res = await runWp(["user", "get", user.username, "--field=roles"]);

  expect(res.exitCode, `User ${user.username} should exist`).toBe(0);

  const roles = res.stdout
    .trim()
    .split(",")
    .map((r) => r.trim());

  expect(
    roles,
    `Expected ${user.username} to have role "${user.role}" but got [${roles.join(", ")}]`,
  ).toContain(user.role);
}
