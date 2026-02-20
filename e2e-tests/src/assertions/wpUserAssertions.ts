import { expect } from "@playwright/test";
import { wp as runWp } from "../utils/wpCli";
import User from "../models/User";

type Driver = "docker" | "remote";

function wpDriver(): Driver {
  return (process.env.WP_DRIVER || "docker").toLowerCase() === "remote"
    ? "remote"
    : "docker";
}

function resolveBaseUrl(): string {
  const raw =
    process.env.WP_REST_BASE_URL ||
    process.env.PW_BASE_URL ||
    process.env.WP_URL ||
    process.env.WP_HOME ||
    "";

  if (!raw) {
    throw new Error(
      "Missing base URL. Set one of: WP_REST_BASE_URL, PW_BASE_URL, WP_URL, WP_HOME",
    );
  }

  return raw.replace(/\/+$/, "");
}

function resolveAuthHeader(): string {
  const user = process.env.WP_REST_USERNAME || process.env.WP_ADMIN_USER || "";
  const pass =
    process.env.WP_REST_PASSWORD || process.env.WP_ADMIN_PASSWORD || "";

  if (!user || !pass) {
    throw new Error(
      "Missing REST auth. Set WP_REST_USERNAME + WP_REST_PASSWORD (recommended: application password) or WP_ADMIN_USER + WP_ADMIN_PASSWORD.",
    );
  }

  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

async function restGet<T>(path: string): Promise<T> {
  const url = `${resolveBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: resolveAuthHeader(),
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? data.message
        : text || `${res.status} ${res.statusText}`;

    throw new Error(`[WP REST] GET ${url} failed: ${message}`);
  }

  return data as T;
}

type WpUserResponse = {
  id: number;
  username?: string;
  slug?: string;
  roles?: string[];
};

async function findUserByUsername(
  username: string,
): Promise<WpUserResponse | null> {
  const users = await restGet<WpUserResponse[]>(
    `/wp-json/wp/v2/users?slug=${encodeURIComponent(username)}&per_page=100`,
  );

  const match = (users || []).find(
    (u) => u.slug === username || u.username === username,
  );

  return match ?? null;
}

export async function expectUserToExist(user: User) {
  if (wpDriver() === "remote") {
    const found = await findUserByUsername(user.username);

    expect(found, `User ${user.username} should exist`).not.toBeNull();

    expect(found?.slug || found?.username).toBe(user.username);
    return;
  }

  const res = await runWp(["user", "get", user.username, "--field=user_login"]);

  expect(res.exitCode, `User ${user.username} should exist`).toBe(0);
  expect(res.stdout.trim()).toBe(user.username);
}

export async function expectUserToHaveRole(user: User) {
  if (wpDriver() === "remote") {
    const found = await findUserByUsername(user.username);

    expect(found, `User ${user.username} should exist`).not.toBeNull();

    const roles = (found?.roles || []).map((r) => r.trim());

    expect(
      roles,
      `Expected ${user.username} to have role "${user.role}" but got [${roles.join(
        ", ",
      )}]`,
    ).toContain(user.role);

    return;
  }

  const res = await runWp(["user", "get", user.username, "--field=roles"]);

  expect(res.exitCode, `User ${user.username} should exist`).toBe(0);

  const roles = res.stdout
    .trim()
    .split(",")
    .map((r) => r.trim());

  expect(
    roles,
    `Expected ${user.username} to have role "${user.role}" but got [${roles.join(
      ", ",
    )}]`,
  ).toContain(user.role);
}
