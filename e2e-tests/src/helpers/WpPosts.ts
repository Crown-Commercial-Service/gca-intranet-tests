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

function wpDriver(): "docker" | "remote" {
  const driver = (process.env.WP_DRIVER || "").toLowerCase().trim();
  if (driver === "remote") return "remote";
  if (driver === "docker") return "docker";

  if (process.env.WP_REMOTE === "true") return "remote";

  const hasBaseUrl = Boolean((process.env.PW_BASE_URL || "").trim());
  const hasDockerCwd = Boolean((process.env.WP_DOCKER_CWD || "").trim());
  return hasBaseUrl && !hasDockerCwd ? "remote" : "docker";
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

async function wpRest<ResponseType>(
  restConfig: RestConfig,
  method: "GET" | "POST" | "DELETE",
  urlPath: string,
  body?: any,
): Promise<ResponseType> {
  const url = `${restConfig.baseUrl}${
    urlPath.startsWith("/") ? "" : "/"
  }${urlPath}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: basicAuthHeader(restConfig),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `WP REST ${method} ${url} failed (${response.status})\n${text}`,
    );
  }

  return text
    ? (JSON.parse(text) as ResponseType)
    : (undefined as ResponseType);
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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`WP REST POST ${url} failed (${response.status})\n${text}`);
  }

  const json = text ? (JSON.parse(text) as any) : {};
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

  async create(post: Post): Promise<number> {
  const shouldApplyCategory = Boolean(post.category);

  const isPage = String(post.type) === "page";
  const shouldApplyTemplate = isPage && Boolean(post.template);

  const resolveTemplateValue = (templateInput: string): string => {
    const template = String(templateInput || "").trim();
    if (!template) return "";

    if (template.toLowerCase().endsWith(".php")) return template;

    const envKey = `WP_TEMPLATE_${toEnvKey(template)}`;
    const override = String(process.env[envKey] || "").trim();
    if (override) return override;

    if (template === "Three Column Template (Category)") {
      return "three-column-template-category.php";
    }

    throw new Error(
      `Unknown page template "${template}". Provide the template file name (e.g. "three-column-template-category.php") or set ${envKey}.`,
    );
  };

  const templateValue = shouldApplyTemplate
    ? resolveTemplateValue(post.template as string)
    : undefined;

  if (wpDriver() === "remote") {
    const restConfig = getRestConfig();

    let featuredMediaId: number | undefined;

    if (post.featuredImagePath) {
      const { resolvedPath } = resolveLocalPath(post.featuredImagePath);
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

    const created = await wpRest<any>(restConfig, "POST", endpoint, {
      title: post.title,
      content: post.content,
      status: post.status,
      ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
      ...(categoryId ? { categories: [categoryId] } : {}),
      ...(templateValue ? { template: templateValue } : {}),
    });

    const createdId = Number(created?.id);
    if (!Number.isFinite(createdId)) {
      throw new Error(`Failed to parse created id from response: ${JSON.stringify(created)}`);
    }

    return createdId;
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

  if (!Number.isFinite(postId)) {
    throw new Error(`Failed to parse post id from: ${createResult.stdout}`);
  }

  if (post.featuredImagePath) {
    await this.setFeaturedImage(postId, post.featuredImagePath);
  }

  if (templateValue) {
    const templateResult = await this.wp([
      "post",
      "meta",
      "update",
      String(postId),
      "_wp_page_template",
      templateValue,
    ]);

    if (templateResult.exitCode !== 0) {
      throw formatWpCliFailure("Failed to set page template", templateResult);
    }
  }

  return postId;
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
    const categories = await wpRest<any[]>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/categories?search=${encodeURIComponent(
        categoryName,
      )}&per_page=100`,
    );

    const exact = (categories || []).find((c) => c?.name === categoryName);
    const match = exact ?? (categories || [])[0];

    return Number(match?.id);
  }

  async clearAll(): Promise<void> {
    if (wpDriver() === "remote") return;

    await this.deletePostsByType("post");
    await this.deletePostsByType("attachment");
  }

  async clearByRunId(runId: string): Promise<void> {
    if (!runId) return;

    if (wpDriver() === "remote") {
      const restConfig = getRestConfig();

      async function deleteBySearch(endpoint: string) {
        const items = await wpRest<any[]>(
          restConfig,
          "GET",
          `${endpoint}?search=${encodeURIComponent(runId)}&per_page=100`,
        );

        for (const item of items) {
          await wpRest(
            restConfig,
            "DELETE",
            `${endpoint}/${item.id}?force=true`,
          );
        }
      }

      await deleteBySearch(`/wp-json/wp/v2/posts`);
      await deleteBySearch(`/wp-json/wp/v2/pages`);

      const raw = (process.env.WP_REST_CUSTOM_TYPES || "").trim();
      if (raw) {
        const types = raw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        for (const type of types) {
          await deleteBySearch(`/wp-json/wp/v2/${restEndpointForType(type)}`);
        }
      }

      await deleteBySearch(`/wp-json/wp/v2/media`);
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
      const restConfig = getRestConfig();
      const post = await wpRest<any>(
        restConfig,
        "GET",
        `/wp-json/wp/v2/posts/${postId}?_fields=date`,
      );
      return String(post?.date || "").trim();
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

    const fileName = path.basename(featuredImagePath);
    const containerTmpPath = `/tmp/${Date.now()}-${fileName}`;

    const { resolvedPath } = resolveLocalPath(featuredImagePath);

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

    const userId = userIdResult.stdout;

    const updateResult = await this.wp([
      "post",
      "update",
      String(postId),
      `--post_author=${userId}`,
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

    const users = await wpRest<any[]>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/users?search=${encodeURIComponent(username)}`,
    );

    const matchingUser = users.find(
      (user) => user.slug === username || user.name === username,
    );

    if (!matchingUser) {
      throw new Error(`User not found: ${username}`);
    }

    const endpoint = `/wp-json/wp/v2/${restEndpointForType(postType)}/${postId}`;

    await wpRest(restConfig, "POST", endpoint, {
      author: matchingUser.id,
    });
  }
}
