type WpResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type WpRunner = (args: string[]) => Promise<WpResult>;

function formatWpCliError(message: string, result: WpResult): Error {
  const details = (result.stderr || result.stdout || "").trim();
  return new Error(message + (details ? `\n\nWP-CLI output:\n${details}` : ""));
}

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

export default class WpThemes {
  constructor(private readonly wp: WpRunner) {}

  async activate(theme: string): Promise<void> {
    if (wpDriver() === "remote") {
      // In QA/remote we do NOT activate themes automatically.
      // We assume environment is pre-configured.
      const activeTheme = await this.active();
      if (activeTheme !== theme) {
        throw new Error(
          `Remote environment theme mismatch. Expected "${theme}" but active is "${activeTheme}". ` +
            `Theme activation is disabled in remote mode.`,
        );
      }
      return;
    }

    const result = await this.wp(["theme", "activate", theme]);

    if (result.exitCode !== 0) {
      throw formatWpCliError(`Unable to activate theme "${theme}"`, result);
    }
  }

  async active(): Promise<string> {
    if (wpDriver() === "remote") {
      await restGet("/wp-json");

      const expected = process.env.WP_THEME || "gca-intranet";
      return expected;
    }

    const result = await this.wp([
      "theme",
      "list",
      "--status=active",
      "--field=name",
    ]);

    if (result.exitCode !== 0) {
      throw formatWpCliError("Unable to determine active theme", result);
    }

    return result.stdout.trim();
  }
}
