import { test, expect } from "../src/wp.fixtures";

test("wp helpers work", async ({ wp }) => {
  const username = "e2e_admin";
  const password = "Password123!";
  const email = "e2e_admin@example.com";

  await wp.upsertUser({
    username,
    password,
    role: "administrator",
    email,
  });

  const res = await wp.exec(["user", "get", username, "--field=user_login"]);

  expect(res.exitCode).toBe(0);
  expect(res.stdout.trim()).toBe(username);
});
