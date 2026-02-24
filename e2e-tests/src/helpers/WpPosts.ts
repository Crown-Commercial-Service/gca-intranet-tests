import fs from "fs";
import path from "path";
import { execa } from "execa";
import type Post from "../models/Post";

type WpResult = { exitCode: number; stdout: string; stderr?: string };

type PathResolution = {
  resolvedPath: string;
  triedPaths: string[];
};

type RestConfig = { baseUrl: string; username: string; password: string };

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
  const configuredServiceName = (process.env.WP_SERVICE || "").trim();
  if (configuredServiceName)
    return mapInitToWordpressService(configuredServiceName);
  return isParallelLocal() ? "wordpress0" : "wordpress";
}

function resolveComposeArgsForService(serviceName: string): string[] {
  const envFileName = (process.env.WP_ENV_FILE || ".env").trim();
  const args = ["compose", "--env-file", envFileName];

  const mustUseParallelCompose =
    isParallelLocal() || isParallelWordpressService(serviceName);

  if (mustUseParallelCompose) {
    args.push("-f", "docker-compose.parallel.local.yml");
  }

  return args;
}

async function getComposeContainerId(
  serviceName: string,
  dockerWorkingDirectory: string,
): Promise<string> {
  const result = await execa(
    "docker",
    [...resolveComposeArgsForService(serviceName), "ps", "-q", serviceName],
    { cwd: dockerWorkingDirectory, timeout: 60_000 },
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

function wpDriver(): "docker" | "remote" {
  const configuredDriver = (process.env.WP_DRIVER || "").toLowerCase().trim();
  if (configuredDriver === "remote") return "remote";
  if (configuredDriver === "docker") return "docker";

  if (process.env.WP_REMOTE === "true") return "remote";

  const hasBaseUrl = Boolean((process.env.PW_BASE_URL || "").trim());
  const hasDockerCwd = Boolean((process.env.WP_DOCKER_CWD || "").trim());
  return hasBaseUrl && !hasDockerCwd ? "remote" : "docker";
}

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
    process.env.WP_USER ||
    ""
  ).trim();

  const password = (
    process.env.WP_API_PASSWORD ||
    process.env.WP_QA_ADMIN_PASSWORD ||
    process.env.WP_ADMIN_APP_PASSWORD ||
    process.env.WP_ADMIN_PASSWORD ||
    process.env.WP_PASSWORD ||
    ""
  ).trim();

  if (!username) {
    throw new Error(
      "Remote WP driver selected but username missing. Set WP_API_USER (recommended) or WP_QA_ADMIN_USER/WP_ADMIN_USER/WP_USER.",
    );
  }

  if (!password) {
    throw new Error(
      "Remote WP driver selected but password missing. Set WP_API_PASSWORD (recommended: Application Password) or WP_QA_ADMIN_PASSWORD/WP_ADMIN_APP_PASSWORD/WP_ADMIN_PASSWORD/WP_PASSWORD.",
    );
  }

  return { baseUrl, username, password };
}

function basicAuthHeader(restConfig: RestConfig): string {
  const token = Buffer.from(
    `${restConfig.username}:${restConfig.password}`,
  ).toString("base64");
  return `Basic ${token}`;
}

async function wpRest(
  restConfig: RestConfig,
  method: "GET" | "POST" | "DELETE",
  urlPath: string,
  body?: unknown,
): Promise<any> {
  const url = `${restConfig.baseUrl}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: basicAuthHeader(restConfig),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();

  if (!response.ok) {
    const hint =
      response.status === 401 || response.status === 403
        ? `\n\nHint: For WP REST writes on QA, prefer a WordPress "Application Password" and set WP_API_USER + WP_API_PASSWORD.`
        : "";
    throw new Error(
      `WP REST ${method} ${url} failed (${response.status})\n${responseText}${hint}`,
    );
  }

  return responseText ? JSON.parse(responseText) : undefined;
}

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function uploadMedia(
  restConfig: RestConfig,
  localFilePath: string,
): Promise<number> {
  const fileName = path.basename(localFilePath);
  const bytes = await fs.promises.readFile(localFilePath);
  const mime = guessMimeType(localFilePath);

  const url = `${restConfig.baseUrl}/wp-json/wp/v2/media`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(restConfig),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": mime,
      Accept: "application/json",
    },
    body: bytes,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `WP REST POST ${url} failed (${response.status})\n${responseText}`,
    );
  }

  const json = responseText ? JSON.parse(responseText) : {};
  return Number(json?.id);
}

function toEnvKey(type: string): string {
  return type.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

/**
 * REST endpoint mapping:
 * - post => posts
 * - page => pages
 * - custom => default to the type itself (e.g. "work-update" => "work-update")
 *   override via WP_REST_ENDPOINT_WORK_UPDATE=work-updates (example)
 */
function restEndpointForType(type: string): string {
  if (type === "post") return "posts";
  if (type === "page") return "pages";

  const envKey = `WP_REST_ENDPOINT_${toEnvKey(type)}`;
  const override = (process.env[envKey] || "").trim();
  if (override) return override;

  return type;
}

export default class WpPosts {
  constructor(private readonly wp: (args: string[]) => Promise<WpResult>) {}

  /**
   * Creates a post (core or custom post type). If a featured image is provided, it will be uploaded/attached.
   * If the post is a normal "post" and a category is provided, it will be applied.
   */
  async create(post: Post): Promise<number> {
    const shouldApplyCategory = post.type === "post" && Boolean(post.category);

    if (wpDriver() === "remote") {
      const restConfig = getRestConfig();

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
              ...triedPaths.map((candidate) => `- ${candidate}`),
            ].join("\n"),
          );
        }

        featuredMediaId = await uploadMedia(restConfig, resolvedPath);
      }

      const endpoint = `/wp-json/wp/v2/${restEndpointForType(String(post.type))}`;

      let categoryId: number | undefined;
      if (shouldApplyCategory) {
        categoryId = await this.getCategoryIdViaApi(
          restConfig,
          post.category as string,
        );
      }

      const created = await wpRest(restConfig, "POST", endpoint, {
        title: post.title,
        content: post.content,
        status: post.status,
        ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
        ...(categoryId ? { categories: [categoryId] } : {}),
      });

      return Number(created?.id);
    }

    let categoryId: number | undefined;
    if (shouldApplyCategory) {
      categoryId = await this.getCategoryIdViaCli(post.category as string);
    }

    const args = [
      "post",
      "create",
      "--porcelain",
      `--post_type=${post.type}`,
      `--post_title=${post.title}`,
      `--post_content=${post.content}`,
      `--post_status=${post.status}`,
    ];

    if (categoryId) {
      args.push(`--post_category=${categoryId}`);
    }

    const createResult = await this.wp(args);

    if (createResult.exitCode !== 0) {
      throw formatWpCliFailure("Failed to create post", createResult);
    }

    const postId = Number(createResult.stdout.trim());

    if (post.featuredImagePath) {
      await this.setFeaturedImage(postId, post.featuredImagePath);
    }

    return postId;
  }

  /**
   * Updates the author of a post (core or custom post type) by username.
   */
  async updatePostAuthor(
    postId: number,
    postType: string,
    username: string,
  ): Promise<void> {
    if (wpDriver() === "remote") {
      await this.updatePostAuthorViaApi(postId, postType, username);
    } else {
      await this.updatePostAuthorViaCli(postId, username);
    }
  }

  private async updatePostAuthorViaCli(
    postId: number,
    username: string,
  ): Promise<void> {
    const userIdResult = await this.wp(["user", "get", username, "--field=ID"]);

    if (userIdResult.exitCode !== 0) {
      throw formatWpCliFailure(
        `Failed to get user id for ${username}`,
        userIdResult,
      );
    }

    const updateResult = await this.wp([
      "post",
      "update",
      String(postId),
      `--post_author=${userIdResult.stdout}`,
    ]);

    if (updateResult.exitCode !== 0) {
      throw formatWpCliFailure(
        `Failed to update post author for post ${postId}`,
        updateResult,
      );
    }
  }

  private async updatePostAuthorViaApi(
    postId: number,
    postType: string,
    username: string,
  ): Promise<void> {
    const restConfig = getRestConfig();

    const users = await wpRest(
      restConfig,
      "GET",
      `/wp-json/wp/v2/users?search=${encodeURIComponent(username)}`,
    );

    const matchingUser = (users || []).find(
      (user: any) => user?.slug === username || user?.name === username,
    );

    if (!matchingUser) {
      throw new Error(`User not found: ${username}`);
    }

    const endpoint = `/wp-json/wp/v2/${restEndpointForType(postType)}/${postId}`;

    await wpRest(restConfig, "POST", endpoint, {
      author: matchingUser.id,
    });
  }

  private async getCategoryIdViaCli(categoryName: string): Promise<number> {
    const result = await this.wp([
      "term",
      "list",
      "category",
      `--name=${categoryName}`,
      "--field=term_id",
      "--format=ids",
    ]);

    if (result.exitCode !== 0) {
      throw formatWpCliFailure(
        `Failed to find category: ${categoryName}`,
        result,
      );
    }

    const firstId = (result.stdout || "").split(/\s+/).filter(Boolean)[0];
    return Number(firstId);
  }

  private async getCategoryIdViaApi(
    restConfig: RestConfig,
    categoryName: string,
  ): Promise<number> {
    const categories = await wpRest(
      restConfig,
      "GET",
      `/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}&per_page=100`,
    );

    const exact = (categories || []).find(
      (category: any) => category?.name === categoryName,
    );
    const match = exact ?? (categories || [])[0];

    return Number(match?.id);
  }

  private async setFeaturedImage(
    postId: number,
    featuredImagePath: string,
  ): Promise<void> {
    const dockerWorkingDirectory = (process.env.WP_DOCKER_CWD || "").trim();
    if (!dockerWorkingDirectory) throw new Error("WP_DOCKER_CWD not set");

    const wordpressServiceName = resolveWordpressServiceName();
    const containerId = await getComposeContainerId(
      wordpressServiceName,
      dockerWorkingDirectory,
    );

    if (!containerId) {
      throw new Error(
        `WordPress container not running (service: ${wordpressServiceName})`,
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
          ...triedPaths.map((candidate) => `- ${candidate}`),
        ].join("\n"),
      );
    }

    await execa(
      "docker",
      ["cp", resolvedPath, `${containerId}:${containerTmpPath}`],
      {
        cwd: dockerWorkingDirectory,
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
