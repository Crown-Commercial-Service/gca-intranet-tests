import fs from "fs";
import path from "path";
import { execa } from "execa";
import type Post from "../models/Post";

type WpResult = { exitCode: number; stdout: string; stderr?: string };

type PathResolution = {
  resolvedPath: string;
  triedPaths: string[];
};

function isParallelLocal(): boolean {
  return process.env.PARALLEL_LOCAL === "true";
}

function isInitService(serviceName: string): boolean {
  return /^init\d+$/.test(serviceName);
}

function isParallelWordpressService(serviceName: string): boolean {
  return /^wordpress\d+$/.test(serviceName);
}

function mapInitToWordpressService(serviceName: string): string {
  return isInitService(serviceName)
    ? serviceName.replace(/^init/, "wordpress")
    : serviceName;
}

function resolveWordpressServiceName(): string {
  const configuredService = (process.env.WP_SERVICE || "").trim();
  if (configuredService) return mapInitToWordpressService(configuredService);
  return isParallelLocal() ? "wordpress0" : "wordpress";
}

function resolveComposeArgsForService(serviceName: string): string[] {
  const envFile = (process.env.WP_ENV_FILE || ".env").trim();
  const args = ["compose", "--env-file", envFile];

  const mustUseParallelCompose =
    isParallelLocal() || isParallelWordpressService(serviceName);

  if (mustUseParallelCompose) {
    args.push("-f", "docker-compose.parallel.local.yml");
  }

  return args;
}

async function getComposeContainerId(
  serviceName: string,
  dockerCwd: string,
): Promise<string> {
  const result = await execa(
    "docker",
    [...resolveComposeArgsForService(serviceName), "ps", "-q", serviceName],
    { cwd: dockerCwd, timeout: 60_000 },
  );

  return (result.stdout || "").trim();
}

function resolveLocalPath(inputPath: string): PathResolution {
  if (path.isAbsolute(inputPath)) {
    return { resolvedPath: inputPath, triedPaths: [inputPath] };
  }

  const triedPaths: string[] = [];

  function tryPath(candidate: string): string | undefined {
    triedPaths.push(candidate);
    return fs.existsSync(candidate) ? candidate : undefined;
  }

  const assetsRoot = (process.env.WP_ASSETS_CWD || "").trim();
  if (assetsRoot) {
    const found = tryPath(path.resolve(assetsRoot, inputPath));
    if (found) return { resolvedPath: found, triedPaths };
  }

  const e2eTestsRoot = path.resolve(__dirname, "../../");

  const foundFromAssets = tryPath(
    path.resolve(e2eTestsRoot, "assets", inputPath),
  );
  if (foundFromAssets) return { resolvedPath: foundFromAssets, triedPaths };

  const foundFromE2eRoot = tryPath(path.resolve(e2eTestsRoot, inputPath));
  if (foundFromE2eRoot) return { resolvedPath: foundFromE2eRoot, triedPaths };

  const foundFromCwd = tryPath(path.resolve(process.cwd(), inputPath));
  if (foundFromCwd) return { resolvedPath: foundFromCwd, triedPaths };

  const wordpressRepo = (process.env.WP_DOCKER_CWD || "").trim();
  if (wordpressRepo) {
    const foundFromWpRepo = tryPath(path.resolve(wordpressRepo, inputPath));
    if (foundFromWpRepo) return { resolvedPath: foundFromWpRepo, triedPaths };
  }

  return { resolvedPath: path.resolve(e2eTestsRoot, inputPath), triedPaths };
}

function formatWpCliFailure(message: string, result: WpResult): Error {
  const details = (result.stderr || result.stdout || "").trim();
  return new Error(message + (details ? `\n\nWP-CLI output:\n${details}` : ""));
}

/**
 * Driver selection (must match wpCli.ts behaviour)
 */
function wpDriver(): "docker" | "remote" {
  const driver = (process.env.WP_DRIVER || "").toLowerCase().trim();
  if (driver === "remote") return "remote";
  if (driver === "docker") return "docker";

  if (process.env.WP_REMOTE === "true") return "remote";

  // Legacy heuristic fallback (only if no explicit driver):
  // If PW_BASE_URL is set but WP_DOCKER_CWD isn't, assume remote.
  const hasBaseUrl = Boolean((process.env.PW_BASE_URL || "").trim());
  const hasDockerCwd = Boolean((process.env.WP_DOCKER_CWD || "").trim());
  return hasBaseUrl && !hasDockerCwd ? "remote" : "docker";
}

function requireEnv(name: string): string {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

type RestConfig = { baseUrl: string; username: string; password: string };

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getRestConfig(): RestConfig {
  const baseUrl = normalizeBaseUrl(
    (process.env.WP_REMOTE_BASE_URL || process.env.PW_BASE_URL || "").trim(),
  );

  if (!baseUrl) {
    throw new Error(
      "Remote WP driver selected but base URL missing. Set WP_REMOTE_BASE_URL (or PW_BASE_URL).",
    );
  }

  const username = (
    process.env.WP_API_USER ||
    process.env.WP_QA_ADMIN_USER ||
    process.env.WP_ADMIN_USER ||
    ""
  ).trim();

  const password = (
    process.env.WP_API_PASSWORD ||
    process.env.WP_QA_ADMIN_PASSWORD ||
    process.env.WP_ADMIN_APP_PASSWORD ||
    process.env.WP_ADMIN_PASSWORD ||
    ""
  ).trim();

  if (!username) {
    throw new Error(
      "Remote WP driver selected but username missing. Set WP_API_USER (recommended) or WP_QA_ADMIN_USER/WP_ADMIN_USER.",
    );
  }

  if (!password) {
    throw new Error(
      "Remote WP driver selected but password missing. Set WP_API_PASSWORD (recommended: Application Password) or WP_QA_ADMIN_PASSWORD/WP_ADMIN_APP_PASSWORD/WP_ADMIN_PASSWORD.",
    );
  }

  return { baseUrl, username, password };
}

function basicAuthHeader(cfg: RestConfig): string {
  const token = Buffer.from(`${cfg.username}:${cfg.password}`).toString(
    "base64",
  );
  return `Basic ${token}`;
}

async function wpRest<T>(
  cfg: RestConfig,
  method: "GET" | "POST" | "DELETE",
  urlPath: string,
  body?: any,
): Promise<T> {
  const url = `${cfg.baseUrl}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: basicAuthHeader(cfg),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`WP REST ${method} ${url} failed (${res.status})\n${text}`);
  }

  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function uploadMedia(
  cfg: RestConfig,
  localFilePath: string,
): Promise<number> {
  const fileName = path.basename(localFilePath);
  const bytes = await fs.promises.readFile(localFilePath);
  const mime = guessMimeType(localFilePath);

  const url = `${cfg.baseUrl}/wp-json/wp/v2/media`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(cfg),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": mime,
      Accept: "application/json",
    },
    body: bytes,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`WP REST POST ${url} failed (${res.status})\n${text}`);
  }

  const json = text ? (JSON.parse(text) as any) : {};
  const id = Number(json?.id);
  if (!Number.isFinite(id)) {
    throw new Error(`Failed to parse media id from response: ${text}`);
  }
  return id;
}

export default class WpPosts {
  constructor(private readonly wp: (args: string[]) => Promise<WpResult>) {}

  async create(post: Post): Promise<number> {
    if (wpDriver() === "remote") {
      const cfg = getRestConfig();

      let featuredMediaId: number | undefined;

      if (post.featuredImagePath) {
        const { resolvedPath, triedPaths } = resolveLocalPath(
          post.featuredImagePath,
        );

        if (!fs.existsSync(resolvedPath)) {
          throw new Error(
            [
              `Featured image not found: ${post.featuredImagePath}`,
              `Tried:`,
              ...triedPaths.map((p) => `- ${p}`),
              ``,
              `Fix: set WP_ASSETS_CWD to the folder that contains the assets.`,
            ].join("\n"),
          );
        }

        featuredMediaId = await uploadMedia(cfg, resolvedPath);
      }

      const isPage = post.type === "page";
      const endpoint = isPage ? "/wp-json/wp/v2/pages" : "/wp-json/wp/v2/posts";

      const created = await wpRest<any>(cfg, "POST", endpoint, {
        title: post.title,
        content: post.content,
        status: post.status,
        ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
      });

      const id = Number(created?.id);
      if (!Number.isFinite(id)) {
        throw new Error(
          `Failed to parse post id from REST response: ${JSON.stringify(created)}`,
        );
      }

      return id;
    }

    // Local/Docker: WP-CLI
    const createResult = await this.wp([
      "post",
      "create",
      "--porcelain",
      `--post_type=${post.type}`,
      `--post_title=${post.title}`,
      `--post_content=${post.content}`,
      `--post_status=${post.status}`,
    ]);

    if (createResult.exitCode !== 0) {
      throw formatWpCliFailure("Failed to create post", createResult);
    }

    const postIdRaw = createResult.stdout.trim();
    const postId = Number(postIdRaw);

    if (!Number.isFinite(postId)) {
      throw new Error(`Failed to parse post id from: ${postIdRaw}`);
    }

    if (post.featuredImagePath) {
      await this.setFeaturedImage(postId, post.featuredImagePath);
    }

    return postId;
  }

  async clearAll(): Promise<void> {
    if (wpDriver() === "remote") {
      // Intentionally NOT supported on QA (too risky to delete everything).
      return;
    }

    await this.deletePostsByType("post");
    await this.deletePostsByType("attachment");
  }

  async clearByRunId(runId: string): Promise<void> {
    if (!runId) return;

    if (wpDriver() === "remote") {
      const cfg = getRestConfig();

      // Posts
      const posts = await wpRest<any[]>(
        cfg,
        "GET",
        `/wp-json/wp/v2/posts?search=${encodeURIComponent(runId)}&per_page=100`,
      );

      for (const p of posts) {
        const id = Number(p?.id);
        if (Number.isFinite(id)) {
          await wpRest(cfg, "DELETE", `/wp-json/wp/v2/posts/${id}?force=true`);
        }
      }

      // Pages (in case tests ever seed pages)
      const pages = await wpRest<any[]>(
        cfg,
        "GET",
        `/wp-json/wp/v2/pages?search=${encodeURIComponent(runId)}&per_page=100`,
      );

      for (const p of pages) {
        const id = Number(p?.id);
        if (Number.isFinite(id)) {
          await wpRest(cfg, "DELETE", `/wp-json/wp/v2/pages/${id}?force=true`);
        }
      }

      // Attachments (best-effort: search by runId)
      const media = await wpRest<any[]>(
        cfg,
        "GET",
        `/wp-json/wp/v2/media?search=${encodeURIComponent(runId)}&per_page=100`,
      );

      for (const m of media) {
        const id = Number(m?.id);
        if (Number.isFinite(id)) {
          await wpRest(cfg, "DELETE", `/wp-json/wp/v2/media/${id}?force=true`);
        }
      }

      return;
    }

    const listResult = await this.wp([
      "post",
      "list",
      "--post_type=post",
      "--format=ids",
      `--search=${runId}`,
    ]);

    const idsRaw = listResult.stdout.trim();
    if (!idsRaw) return;

    await this.wp(["post", "delete", ...idsRaw.split(/\s+/), "--force"]);
  }

  async getPublishedDate(postId: number): Promise<string> {
    if (wpDriver() === "remote") {
      const cfg = getRestConfig();
      const post = await wpRest<any>(
        cfg,
        "GET",
        `/wp-json/wp/v2/posts/${postId}?_fields=date`,
      );
      const date = String(post?.date || "").trim();
      if (!date) throw new Error(`Missing date for post ${postId}`);
      return date;
    }

    const result = await this.wp([
      "post",
      "get",
      String(postId),
      "--field=post_date",
    ]);

    if (result.exitCode !== 0) {
      throw formatWpCliFailure("Failed to read post_date", result);
    }

    return result.stdout.trim();
  }

  private async deletePostsByType(postType: string): Promise<void> {
    const listResult = await this.wp([
      "post",
      "list",
      `--post_type=${postType}`,
      "--format=ids",
    ]);

    const idsRaw = listResult.stdout.trim();
    if (!idsRaw) return;

    await this.wp(["post", "delete", ...idsRaw.split(/\s+/), "--force"]);
  }

  private async setFeaturedImage(
    postId: number,
    featuredImagePath: string,
  ): Promise<void> {
    const dockerCwd = (process.env.WP_DOCKER_CWD || "").trim();
    if (!dockerCwd) throw new Error("WP_DOCKER_CWD not set");

    const wordpressService = resolveWordpressServiceName();
    const containerId = await getComposeContainerId(
      wordpressService,
      dockerCwd,
    );

    if (!containerId) {
      throw new Error(
        `WordPress container not running (service: ${wordpressService})`,
      );
    }

    const fileName = path.basename(featuredImagePath);
    const containerTmpPath = `/tmp/${Date.now()}-${fileName}`;

    const { resolvedPath, triedPaths } = resolveLocalPath(featuredImagePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        [
          `Featured image not found: ${featuredImagePath}`,
          `Tried:`,
          ...triedPaths.map((p) => `- ${p}`),
          ``,
          `Fix: set WP_ASSETS_CWD to the folder that contains the assets.`,
        ].join("\n"),
      );
    }

    await execa(
      "docker",
      ["cp", resolvedPath, `${containerId}:${containerTmpPath}`],
      {
        cwd: dockerCwd,
        timeout: 120_000,
      },
    );

    const importResult = await this.wp([
      "media",
      "import",
      containerTmpPath,
      "--porcelain",
    ]);

    if (importResult.exitCode !== 0) {
      throw formatWpCliFailure("Failed to import featured image", importResult);
    }

    const attachmentId = importResult.stdout.trim();
    const metaResult = await this.wp([
      "post",
      "meta",
      "update",
      String(postId),
      "_thumbnail_id",
      attachmentId,
    ]);

    if (metaResult.exitCode !== 0) {
      throw formatWpCliFailure("Failed to set featured image", metaResult);
    }
  }
}
