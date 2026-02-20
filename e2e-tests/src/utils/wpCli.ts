import { execa } from "execa";

type WpResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

type WpOpts = { timeoutMs?: number; service?: string };

function isParallel(): boolean {
  return process.env.PARALLEL_LOCAL === "true";
}

function needsParallelFile(service: string): boolean {
  return isParallel() || /^wordpress\d+$/.test(service);
}

function composeArgs(service: string): string[] {
  const envFile = process.env.WP_ENV_FILE || ".env";
  const args = ["compose", "--env-file", envFile];

  if (needsParallelFile(service)) {
    args.push("-f", "docker-compose.parallel.local.yml");
  }

  return args;
}

function wpDriver(): "docker" | "remote" {
  // Prefer explicit driver; fall back to legacy envs.
  const driver = (process.env.WP_DRIVER || "").toLowerCase().trim();
  if (driver === "remote") return "remote";
  if (driver === "docker") return "docker";

  // If you set this for QA runs, we switch to remote mode.
  if (process.env.WP_REMOTE === "true") return "remote";

  return "docker";
}

function resolveRemoteBaseUrl(): string {
  const raw =
    process.env.WP_REMOTE_BASE_URL ||
    process.env.PW_BASE_URL ||
    process.env.WP_BASE_URL ||
    "";
  if (!raw) {
    throw new Error(
      "Remote WP driver selected but no base URL found. Set WP_REMOTE_BASE_URL (or PW_BASE_URL).",
    );
  }
  return raw.replace(/\/+$/, "");
}

function resolveRemoteAuth(): { user: string; pass: string } {
  const user =
    process.env.WP_API_USER ||
    process.env.WP_ADMIN_USER ||
    process.env.WP_USER ||
    "";
  const pass =
    process.env.WP_API_PASSWORD ||
    process.env.WP_ADMIN_APP_PASSWORD ||
    process.env.WP_ADMIN_PASSWORD ||
    "";

  if (!user || !pass) {
    throw new Error(
      "Remote WP driver selected but credentials missing. Set WP_API_USER + WP_API_PASSWORD (recommended: Application Password).",
    );
  }

  return { user, pass };
}

function basicAuthHeader(user: string, pass: string): string {
  // Node 20 has Buffer
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

function parseFlagValue(args: string[], prefix: string): string | undefined {
  const hit = args.find((a) => a.startsWith(prefix));
  if (!hit) return undefined;
  const [, value] = hit.split("=", 2);
  return value;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function remoteWp(args: string[]): Promise<WpResult> {
  // Minimal subset needed for QA seeding/cleanup.
  // Supported:
  // - post create --porcelain --post_type=post|page --post_title= --post_content= --post_status=
  // - post list --post_type=post --format=ids --search=RUN_ID
  // - post delete <ids...> --force
  // - post get <id> --field=post_date
  const baseUrl = resolveRemoteBaseUrl();
  const { user, pass } = resolveRemoteAuth();
  const auth = basicAuthHeader(user, pass);

  const [resource, action, ...rest] = args;

  if (resource !== "post") {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `Remote wp() only supports "post" commands for now. Got: ${args.join(" ")}`,
    };
  }

  const apiRoot = `${baseUrl}/wp-json/wp/v2`;

  try {
    // post create ...
    if (action === "create") {
      const postType = parseFlagValue(rest, "--post_type=") || "post";
      const title = parseFlagValue(rest, "--post_title=") || "";
      const content = parseFlagValue(rest, "--post_content=") || "";
      const status = parseFlagValue(rest, "--post_status=") || "draft";
      const porcelain = hasFlag(rest, "--porcelain");

      const endpoint = postType === "page" ? "pages" : "posts";

      const res = await fetch(`${apiRoot}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, status }),
      });

      const text = await res.text();
      if (!res.ok) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `WP REST create failed (${res.status}): ${text}`,
        };
      }

      const json = JSON.parse(text) as { id?: number };
      const id = Number(json.id);
      if (!Number.isFinite(id)) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `WP REST create returned unexpected payload: ${text}`,
        };
      }

      return {
        exitCode: 0,
        stdout: porcelain ? String(id) : text,
        stderr: "",
      };
    }

    // post list ...
    if (action === "list") {
      const postType = parseFlagValue(rest, "--post_type=") || "post";
      const format = parseFlagValue(rest, "--format=") || "";
      const search = parseFlagValue(rest, "--search=") || "";

      if (format !== "ids") {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `Remote wp post list only supports --format=ids. Got: ${args.join(" ")}`,
        };
      }

      const endpoint = postType === "page" ? "pages" : "posts";

      // Use search, and grab lots of results so cleanup works.
      const url = new URL(`${apiRoot}/${endpoint}`);
      if (search) url.searchParams.set("search", search);
      url.searchParams.set("per_page", "100");
      url.searchParams.set("_fields", "id");

      const res = await fetch(url.toString(), {
        headers: { Authorization: auth },
      });

      const text = await res.text();
      if (!res.ok) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `WP REST list failed (${res.status}): ${text}`,
        };
      }

      const items = JSON.parse(text) as Array<{ id: number }>;
      const ids = items.map((i) => i.id).filter((n) => Number.isFinite(n));
      return { exitCode: 0, stdout: ids.join(" "), stderr: "" };
    }

    // post delete <ids...> --force
    if (action === "delete") {
      const force = hasFlag(rest, "--force");
      const ids = rest.filter((a) => /^\d+$/.test(a));

      if (!force) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `Remote wp post delete requires --force. Got: ${args.join(" ")}`,
        };
      }

      // Delete sequentially to keep it simple + readable errors.
      for (const id of ids) {
        const res = await fetch(`${apiRoot}/posts/${id}?force=true`, {
          method: "DELETE",
          headers: { Authorization: auth },
        });

        const text = await res.text();
        if (!res.ok) {
          return {
            exitCode: 1,
            stdout: "",
            stderr: `WP REST delete failed for ${id} (${res.status}): ${text}`,
          };
        }
      }

      return { exitCode: 0, stdout: "", stderr: "" };
    }

    // post get <id> --field=post_date
    if (action === "get") {
      const id = rest.find((a) => /^\d+$/.test(a));
      const field = parseFlagValue(rest, "--field=");

      if (!id) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `Remote wp post get missing id. Got: ${args.join(" ")}`,
        };
      }

      if (field !== "post_date") {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `Remote wp post get only supports --field=post_date. Got: ${args.join(" ")}`,
        };
      }

      const res = await fetch(`${apiRoot}/posts/${id}?_fields=date`, {
        headers: { Authorization: auth },
      });

      const text = await res.text();
      if (!res.ok) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: `WP REST get failed (${res.status}): ${text}`,
        };
      }

      const json = JSON.parse(text) as { date?: string };
      return { exitCode: 0, stdout: (json.date || "").trim(), stderr: "" };
    }

    return {
      exitCode: 1,
      stdout: "",
      stderr: `Remote wp() unsupported command: ${args.join(" ")}`,
    };
  } catch (e: any) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: e?.message ?? String(e),
    };
  }
}

export async function wp(args: string[], opts?: WpOpts): Promise<WpResult> {
  if (wpDriver() === "remote") {
    return remoteWp(args);
  }

  // DOCKER DRIVER (existing behaviour)
  const timeout = opts?.timeoutMs ?? 120_000;
  const cwd = process.env.WP_DOCKER_CWD;

  if (!cwd) {
    return { exitCode: 1, stdout: "", stderr: "WP_DOCKER_CWD env var not set" };
  }

  const service = opts?.service ?? process.env.WP_SERVICE ?? "wordpress";

  const cmd = [
    ...composeArgs(service),
    "exec",
    "-T",
    service,
    "wp",
    ...args,
    "--allow-root",
  ];

  try {
    const res = await execa("docker", cmd, { cwd, timeout });
    return {
      exitCode: res.exitCode ?? 0,
      stdout: res.stdout ?? "",
      stderr: res.stderr ?? "",
    };
  } catch (err: unknown) {
    const e = err as any;
    return {
      exitCode: e?.exitCode ?? 1,
      stdout: e?.stdout ?? "",
      stderr: e?.stderr ?? e?.message ?? String(e),
    };
  }
}
