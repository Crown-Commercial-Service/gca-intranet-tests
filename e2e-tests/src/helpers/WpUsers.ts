import type User from "../models/User";

type UserLike = Pick<User, "username" | "password" | "email" | "role">;

function baseUrl(): string {
  const raw = (
    process.env.WP_REST_BASE_URL ||
    process.env.PW_BASE_URL ||
    process.env.WP_URL ||
    process.env.WP_HOME ||
    ""
  ).trim();

  if (!raw) {
    throw new Error(
      "Missing base URL. Set one of: WP_REST_BASE_URL, PW_BASE_URL, WP_URL, WP_HOME",
    );
  }

  return raw.replace(/\/+$/, "");
}

function authHeader(): string {
  const user =
    process.env.WP_API_USER ||
    process.env.WP_REST_USERNAME ||
    process.env.WP_ADMIN_USER ||
    "";
  const pass =
    process.env.WP_API_PASSWORD ||
    process.env.WP_REST_PASSWORD ||
    process.env.WP_ADMIN_PASSWORD ||
    "";

  if (!user || !pass) {
    throw new Error(
      "Missing REST auth. Set WP_REST_USERNAME + WP_REST_PASSWORD (recommended, use WP Application Password), or WP_ADMIN_USER + WP_ADMIN_PASSWORD.",
    );
  }

  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

async function rest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T; raw: string }> {
  const url = `${baseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const controller = new AbortController();
  const timeoutMs = Number(process.env.WP_REST_TIMEOUT_MS || "60000");
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const raw = await res.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = raw as any;
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" && data && "message" in data
          ? (data as any).message
          : raw || `${res.status} ${res.statusText}`;

      throw new Error(`[WP REST] ${method} ${url} failed: ${msg}`);
    }

    return { status: res.status, data: data as T, raw };
  } finally {
    clearTimeout(t);
  }
}

type WpUserResponse = {
  id: number;
  username?: string;
  slug?: string;
  name?: string;
  email?: string;
};

async function findUserIdByUsername(username: string): Promise<number | null> {
  const { data } = await rest<WpUserResponse[]>(
    "GET",
    `/wp-json/wp/v2/users?slug=${encodeURIComponent(username)}&per_page=100`,
  );

  const match = (data || []).find(
    (u) => u.slug === username || u.username === username,
  );

  return match?.id ?? null;
}

export default class WpUsers {
  async exists(username: string): Promise<boolean> {
    const id = await findUserIdByUsername(username);
    return id != null;
  }

  async upsert(user: UserLike): Promise<void> {
    const exists = await this.exists(user.username);

    if (exists) {
      const id = await findUserIdByUsername(user.username);
      if (!id) throw new Error(`User "${user.username}" does not exist`);

      await rest("POST", `/wp-json/wp/v2/users/${id}`, {
        password: user.password,
        roles: [user.role],
      });

      return;
    }

    await rest("POST", "/wp-json/wp/v2/users", {
      username: user.username,
      email: user.email,
      password: user.password,
      roles: [user.role],
    });
  }
}
