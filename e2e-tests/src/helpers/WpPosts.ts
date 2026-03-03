import { execa } from "execa";
import path from "path";
import type Post from "../models/Post";

import * as utils from "../utils/wp-utils";
import * as rest from "../lib/wp-rest-client";
import * as docker from "../lib/wp-docker-client";

export default class WpPosts {
  constructor(
    private readonly wp: (args: string[]) => Promise<utils.WpResult>,
  ) {}

  /**
   * Main entry point for creating posts, pages, or custom types.
   */
  async create(post: Post): Promise<number> {
    const shouldApplyCategory = Boolean(post.category);
    const isPage = String(post.type) === "page";
    const shouldApplyTemplate = isPage && Boolean(post.template);

    const templateValue = shouldApplyTemplate
      ? this.resolveTemplateValue(post.template as string)
      : undefined;

    // --- REMOTE DRIVER PATH ---
    if (docker.wpDriver() === "remote") {
      const restConfig = rest.getRestConfig();
      let featuredMediaId: number | undefined;

      if (post.featuredImagePath) {
        const { resolvedPath } = utils.resolveLocalPath(post.featuredImagePath);
        featuredMediaId = await rest.uploadMedia(restConfig, resolvedPath);
      }

      const endpoint = `/wp-json/wp/v2/${rest.restEndpointForType(String(post.type))}`;

      let categoryId: number | undefined;
      if (shouldApplyCategory) {
        categoryId = await this.getCategoryIdViaApi(
          restConfig,
          post.category as string,
        );
      }

      const created = await rest.wpRest<any>(restConfig, "POST", endpoint, {
        title: post.title,
        content: post.content,
        status: post.status,
        ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
        ...(categoryId ? { categories: [categoryId] } : {}),
        ...(templateValue ? { template: templateValue } : {}),
      });

      const createdId = Number(created?.id);
      if (!Number.isFinite(createdId)) {
        throw new Error(
          `Failed to parse created id from API: ${JSON.stringify(created)}`,
        );
      }
      return createdId;
    }

    // --- DOCKER/CLI DRIVER PATH ---
    let categoryId: number | undefined;
    if (shouldApplyCategory) {
      categoryId = await this.getCategoryIdViaCli(post.category as string);
    }

    const expectedUser = (
      post.author ||
      process.env.WP_ADMIN_USER ||
      process.env.WP_ADMIN_USERNAME ||
      process.env.WP_USER ||
      process.env.WP_API_USER ||
      ""
    ).trim();

    if (!expectedUser) {
      throw new Error(
        "Missing author username. Set post.author or one of: WP_ADMIN_USER, WP_ADMIN_USERNAME, WP_USER, WP_API_USER",
      );
    }

    const userRes = await this.wp(["user", "get", expectedUser, "--field=ID"]);
    if (userRes.exitCode !== 0) {
      throw utils.formatWpCliFailure(
        `Failed to resolve author id for "${expectedUser}"`,
        userRes,
      );
    }

    const authorId = (userRes.stdout || "").trim();
    if (!authorId) {
      throw new Error(`Author id not found for "${expectedUser}"`);
    }

    const args = [
      "post",
      "create",
      "--porcelain",
      `--post_type=${post.type}`,
      `--post_title=${post.title}`,
      `--post_content=${post.content}`,
      `--post_status=${post.status}`,
      `--post_author=${authorId}`,
    ];

    if (categoryId) args.push(`--post_category=${categoryId}`);

    const createResult = await this.wp(args);
    if (createResult.exitCode !== 0) {
      throw utils.formatWpCliFailure("Failed to create post", createResult);
    }

    const postId = Number(createResult.stdout.trim());
    if (!Number.isFinite(postId)) {
      throw new Error(
        `Failed to parse post id from CLI: ${createResult.stdout}`,
      );
    }

    if (post.featuredImagePath) {
      await this.setFeaturedImageCli(postId, post.featuredImagePath);
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
        throw utils.formatWpCliFailure(
          "Failed to set page template",
          templateResult,
        );
      }
    }

    return postId;
  }

  async clearByRunId(runId: string): Promise<void> {
    if (!runId) return;

    if (docker.wpDriver() === "remote") {
      const restConfig = rest.getRestConfig();
      const endpoints = [
        "posts",
        "pages",
        "work_updates",
        "blogs",
        "news",
        "media",
      ];

      for (const ep of endpoints) {
        const items = await rest.wpRest<any[]>(
          restConfig,
          "GET",
          `/wp-json/wp/v2/${ep}?search=${encodeURIComponent(runId)}&per_page=100`,
        );
        for (const item of items) {
          await rest.wpRest(
            restConfig,
            "DELETE",
            `/wp-json/wp/v2/${ep}/${item.id}?force=true`,
          );
        }
      }
      return;
    }

    const types = [
      "post",
      "page",
      "work_update",
      "blog",
      "news",
      "event",
      "attachment",
    ];
    for (const type of types) {
      const list = await this.wp([
        "post",
        "list",
        `--post_type=${type}`,
        "--format=ids",
        `--search=${runId}`,
      ]);
      const ids = list.stdout.trim();
      if (ids)
        await this.wp(["post", "delete", ...ids.split(/\s+/), "--force"]);
    }
  }

  async clearByTypeAndRunId(postType: string, runId: string): Promise<void> {
    if (!runId) return;

    if (docker.wpDriver() === "remote") return;

    const list = await this.wp([
      "post",
      "list",
      `--post_type=${postType}`,
      "--format=ids",
      `--search=${runId}`,
    ]);

    const ids = (list.stdout || "").trim();
    if (!ids) return;

    await this.wp(["post", "delete", ...ids.split(/\s+/), "--force"]);
  }
  
  async getPublishedDate(postId: number): Promise<string> {
    if (docker.wpDriver() === "remote") {
      const post = await rest.wpRest<any>(
        rest.getRestConfig(),
        "GET",
        `/wp-json/wp/v2/posts/${postId}?_fields=date`,
      );
      return String(post?.date || "").trim();
    }
    const res = await this.wp([
      "post",
      "get",
      String(postId),
      "--field=post_date",
    ]);
    return res.stdout.trim();
  }

  async updatePostAuthor(
    postId: number,
    postType: string,
    username: string,
  ): Promise<void> {
    if (docker.wpDriver() === "remote") {
      const config = rest.getRestConfig();
      const users = await rest.wpRest<any[]>(
        config,
        "GET",
        `/wp-json/wp/v2/users?search=${encodeURIComponent(username)}`,
      );
      const user = users.find(
        (u) => u.slug === username || u.name === username,
      );
      if (!user) throw new Error(`User not found: ${username}`);
      await rest.wpRest(
        config,
        "POST",
        `/wp-json/wp/v2/${rest.restEndpointForType(postType)}/${postId}`,
        { author: user.id },
      );
    } else {
      const userRes = await this.wp(["user", "get", username, "--field=ID"]);
      await this.wp([
        "post",
        "update",
        String(postId),
        `--post_author=${userRes.stdout.trim()}`,
      ]);
    }
  }

  // --- Private Helpers ---

  private async setFeaturedImageCli(
    postId: number,
    imgPath: string,
  ): Promise<void> {
    const dockerCwd = (process.env.WP_DOCKER_CWD || "").trim();
    const containerId = await docker.getComposeContainerId(
      docker.resolveWordpressServiceName(),
      dockerCwd,
    );
    const { resolvedPath } = utils.resolveLocalPath(imgPath);
    const containerTmpPath = `/tmp/${Date.now()}-${path.basename(imgPath)}`;

    await execa(
      "docker",
      ["cp", resolvedPath, `${containerId}:${containerTmpPath}`],
      { cwd: dockerCwd },
    );
    const importRes = await this.wp([
      "media",
      "import",
      containerTmpPath,
      "--porcelain",
    ]);
    await this.wp([
      "post",
      "meta",
      "update",
      String(postId),
      "_thumbnail_id",
      importRes.stdout.trim(),
    ]);
  }

  private resolveTemplateValue(templateInput: string): string {
    const template = String(templateInput || "").trim();
    if (!template) return "";
    if (template.toLowerCase().endsWith(".php")) return template;

    const envKey = `WP_TEMPLATE_${utils.toEnvKey(template)}`;
    const override = String(process.env[envKey] || "").trim();
    if (override) return override;

    if (template === "Three Column Template (Category)")
      return "three-column-template-category.php";
    throw new Error(`Unknown template "${template}". Set ${envKey}.`);
  }

  private async getCategoryIdViaCli(name: string): Promise<number> {
    const res = await this.wp([
      "term",
      "list",
      "category",
      `--name=${name}`,
      "--field=term_id",
      "--format=ids",
    ]);
    return Number((res.stdout || "").split(/\s+/)[0]);
  }

  private async getCategoryIdViaApi(
    config: rest.RestConfig,
    name: string,
  ): Promise<number> {
    const cats = await rest.wpRest<any[]>(
      config,
      "GET",
      `/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}`,
    );
    const match = cats.find((c) => c?.name === name) ?? cats[0];
    return Number(match?.id);
  }
}
