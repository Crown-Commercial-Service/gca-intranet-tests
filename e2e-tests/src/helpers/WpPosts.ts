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

  const assetsRoot = (process.env.WP_ASSETS_CWD || "").trim();
  if (assetsRoot) {
    const candidate = path.resolve(assetsRoot, inputPath);
    triedPaths.push(candidate);
    if (fs.existsSync(candidate))
      return { resolvedPath: candidate, triedPaths };
  }

  const fromCurrentRepo = path.resolve(process.cwd(), inputPath);
  triedPaths.push(fromCurrentRepo);
  if (fs.existsSync(fromCurrentRepo)) {
    return { resolvedPath: fromCurrentRepo, triedPaths };
  }

  const wordpressRepo = (process.env.WP_DOCKER_CWD || "").trim();
  if (wordpressRepo) {
    const fromWordpressRepo = path.resolve(wordpressRepo, inputPath);
    triedPaths.push(fromWordpressRepo);
    if (fs.existsSync(fromWordpressRepo)) {
      return { resolvedPath: fromWordpressRepo, triedPaths };
    }
  }

  return { resolvedPath: fromCurrentRepo, triedPaths };
}

function formatWpCliFailure(message: string, result: WpResult): Error {
  const details = (result.stderr || result.stdout || "").trim();
  return new Error(message + (details ? `\n\nWP-CLI output:\n${details}` : ""));
}

export default class WpPosts {
  constructor(private readonly wp: (args: string[]) => Promise<WpResult>) {}

  async create(post: Post): Promise<number> {
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
    await this.deletePostsByType("post");
    await this.deletePostsByType("attachment");
  }

  async clearByRunId(runId: string): Promise<void> {
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
          `Fix: set WP_ASSETS_CWD to the repo that contains the assets path.`,
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
