import path from "path";
import type Post from "../models/Post";
import logger from "../utils/logger";

import * as utils from "../utils/wp-utils";
import * as rest from "../lib/wp-rest-client";
import * as docker from "../lib/wp-docker-client";

export default class WpPosts {
  constructor(
    private readonly wp: (args: string[]) => Promise<utils.WpResult>,
  ) {}

  async create(post: Post): Promise<number> {
    return this.createOne(post);
  }

  async createMany(posts: Post[]): Promise<number[]> {
    return Promise.all(posts.map((post) => this.createOne(post)));
  }

  async clearByRunId(runId: string): Promise<void> {
    if (!runId) return;

    if (this.isRemoteDriver()) {
      const restConfig = rest.getRestConfig();
      const endpoints = [
        "posts",
        "pages",
        "work_updates",
        "blogs",
        "news",
        "media",
      ];

      for (const endpoint of endpoints) {
        const items = await rest.wpRest<any[]>(
          restConfig,
          "GET",
          `/wp-json/wp/v2/${endpoint}?search=${encodeURIComponent(runId)}&per_page=100`,
        );

        for (const item of items) {
          await rest.wpRest(
            restConfig,
            "DELETE",
            `/wp-json/wp/v2/${endpoint}/${item.id}?force=true`,
          );
        }
      }

      return;
    }

    const postTypes = [
      "post",
      "page",
      "work_update",
      "blog",
      "news",
      "event",
      "attachment",
    ];

    for (const postType of postTypes) {
      const listResult = await this.wp([
        "post",
        "list",
        `--post_type=${postType}`,
        "--format=ids",
        `--search=${runId}`,
      ]);

      const ids = (listResult.stdout || "").trim();
      if (!ids) continue;

      await this.wp(["post", "delete", ...ids.split(/\s+/), "--force"]);
    }
  }

  async clearByTypeAndRunId(postType: string, runId: string): Promise<void> {
    if (!runId) return;
    if (this.isRemoteDriver()) return;

    const listResult = await this.wp([
      "post",
      "list",
      `--post_type=${postType}`,
      "--format=ids",
      `--search=${runId}`,
    ]);

    const ids = (listResult.stdout || "").trim();
    if (!ids) return;

    await this.wp(["post", "delete", ...ids.split(/\s+/), "--force"]);
  }

  async clearByTypeAndAuthor(postType: string): Promise<void> {
    if (this.isRemoteDriver()) {
      const username = this.getRemoteUsername();
      const restConfig = rest.getRestConfig();
      const user = await this.findRemoteUser(restConfig, username);

      const endpoint =
        postType === "attachment"
          ? "media"
          : rest.restEndpointForType(postType);

      const items = await rest.wpRest<any[]>(
        restConfig,
        "GET",
        `/wp-json/wp/v2/${endpoint}?author=${user.id}&per_page=100`,
      );

      for (const item of items) {
        await rest.wpRest(
          restConfig,
          "DELETE",
          `/wp-json/wp/v2/${endpoint}/${item.id}?force=true`,
        );
      }

      return;
    }

    const username = this.getLocalUsername();
    const authorId = await this.getLocalAuthorId(username);

    const listResult = await this.wp([
      "post",
      "list",
      `--post_type=${postType}`,
      `--author=${authorId}`,
      "--format=ids",
    ]);

    const ids = (listResult.stdout || "").trim();
    if (!ids) return;

    await this.wp(["post", "delete", ...ids.split(/\s+/), "--force"]);
  }

  async getPublishedDate(postId: number): Promise<string> {
    if (this.isRemoteDriver()) {
      const post = await rest.wpRest<any>(
        rest.getRestConfig(),
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

    return (result.stdout || "").trim();
  }

  async updatePostAuthor(
    postId: number,
    postType: string,
    username: string,
  ): Promise<void> {
    if (this.isRemoteDriver()) {
      const restConfig = rest.getRestConfig();
      const user = await this.findRemoteUser(restConfig, username);

      await rest.wpRest(
        restConfig,
        "POST",
        `/wp-json/wp/v2/${rest.restEndpointForType(postType)}/${postId}`,
        { author: user.id },
      );

      return;
    }

    const authorId = await this.getLocalAuthorId(username);

    await this.wp([
      "post",
      "update",
      String(postId),
      `--post_author=${authorId}`,
    ]);
  }

  async createPages(pages: Post[]): Promise<void> {
    if (pages.length === 0) return;

    if (this.isRemoteDriver()) {
      for (const page of pages) {
        await this.createOne(page);
      }
      return;
    }

    const authorId = await this.getDefaultLocalAuthorId();

    const pagePayload = pages.map((page) => ({
      post_title: page.title,
      post_content: page.content,
      post_status: page.status,
      post_type: "page",
      post_author: Number(authorId),
    }));

    const php = `
      $pages = json_decode('${JSON.stringify(pagePayload)}', true);
      foreach ($pages as $page) {
        wp_insert_post($page);
      }
    `;

    const result = await this.wp(["eval", php]);

    if (result.exitCode !== 0) {
      throw utils.formatWpCliFailure("Failed to create pages in batch", result);
    }
  }

  private async createOne(post: Post): Promise<number> {
    const isPage = String(post.type) === "page";
    const shouldApplyCategory = Boolean(post.category);
    const shouldApplyTemplate = isPage && Boolean(post.template);

    const templateValue = shouldApplyTemplate
      ? this.resolveTemplateValue(String(post.template))
      : undefined;

    if (this.isRemoteDriver()) {
      return this.createOneRemote(post, shouldApplyCategory, templateValue);
    }

    return this.createOneLocal(post, shouldApplyCategory, templateValue);
  }

  private async createOneRemote(
    post: Post,
    shouldApplyCategory: boolean,
    templateValue?: string,
  ): Promise<number> {
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
        String(post.category),
      );
    }

    logger.info(
      {
        postType: post.type,
        endpoint,
        baseUrl: restConfig.baseUrl,
      },
      "Creating WordPress post via REST API",
    );

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

  private async createOneLocal(
    post: Post,
    shouldApplyCategory: boolean,
    templateValue?: string,
  ): Promise<number> {
    let categoryId: number | undefined;
    if (shouldApplyCategory) {
      categoryId = await this.getCategoryIdViaCli(String(post.category));
    }

    const username = this.getPostAuthorUsername(post);
    const authorId = await this.getLocalAuthorId(username);

    const commandArguments = [
      "post",
      "create",
      "--porcelain",
      `--post_type=${post.type}`,
      `--post_title=${post.title}`,
      `--post_content=${post.content}`,
      `--post_status=${post.status}`,
      `--post_author=${authorId}`,
    ];

    if (categoryId) {
      commandArguments.push(`--post_category=${categoryId}`);
    }

    const createResult = await this.wp(commandArguments);
    if (createResult.exitCode !== 0) {
      throw utils.formatWpCliFailure("Failed to create post", createResult);
    }

    const postId = Number((createResult.stdout || "").trim());
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

  private async setFeaturedImageCli(
    postId: number,
    imagePath: string,
  ): Promise<void> {
    const { execa } = await import("execa");

    const dockerWorkingDirectory = (process.env.WP_DOCKER_CWD || "").trim();
    const containerId = await docker.getComposeContainerId(
      docker.resolveWordpressServiceName(),
      dockerWorkingDirectory,
    );

    const { resolvedPath } = utils.resolveLocalPath(imagePath);
    const containerTemporaryPath = `/tmp/${Date.now()}-${path.basename(imagePath)}`;

    await execa(
      "docker",
      ["cp", resolvedPath, `${containerId}:${containerTemporaryPath}`],
      { cwd: dockerWorkingDirectory },
    );

    const importResult = await this.wp([
      "media",
      "import",
      containerTemporaryPath,
      "--porcelain",
    ]);

    await this.wp([
      "post",
      "meta",
      "update",
      String(postId),
      "_thumbnail_id",
      (importResult.stdout || "").trim(),
    ]);
  }

  private resolveTemplateValue(templateInput: string): string {
    const template = String(templateInput || "").trim();

    if (!template) return "";
    if (template.toLowerCase().endsWith(".php")) return template;

    const environmentKey = `WP_TEMPLATE_${utils.toEnvKey(template)}`;
    const override = String(process.env[environmentKey] || "").trim();

    if (override) return override;

    if (template === "Three Column Template (Category)") {
      return "three-column-template-category.php";
    }

    throw new Error(`Unknown template "${template}". Set ${environmentKey}.`);
  }

  private async getCategoryIdViaCli(name: string): Promise<number> {
    const result = await this.wp([
      "term",
      "list",
      "category",
      `--name=${name}`,
      "--field=term_id",
      "--format=ids",
    ]);

    return Number(((result.stdout || "").split(/\s+/)[0] || "").trim());
  }

  private async getCategoryIdViaApi(
    restConfig: rest.RestConfig,
    name: string,
  ): Promise<number> {
    const categories = await rest.wpRest<any[]>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}`,
    );

    const match =
      categories.find((category) => category?.name === name) ?? categories[0];

    return Number(match?.id);
  }

  private isRemoteDriver(): boolean {
    return docker.wpDriver() === "remote";
  }

  private getPostAuthorUsername(post: Post): string {
    const username = (
      post.author ||
      process.env.WP_ADMIN_USER ||
      process.env.WP_ADMIN_USERNAME ||
      process.env.WP_USER ||
      process.env.WP_API_USER ||
      ""
    ).trim();

    if (!username) {
      throw new Error(
        "Missing author username. Set post.author or one of: WP_ADMIN_USER, WP_ADMIN_USERNAME, WP_USER, WP_API_USER",
      );
    }

    return username;
  }

  private getRemoteUsername(): string {
    const username = (process.env.WP_API_USER || "").trim();

    if (!username) {
      throw new Error("No username found in env: WP_API_USER");
    }

    return username;
  }

  private getLocalUsername(): string {
    const username = (
      process.env.WP_ADMIN_USER ||
      process.env.WP_ADMIN_USERNAME ||
      process.env.WP_USER ||
      process.env.WP_API_USER ||
      ""
    ).trim();

    if (!username) {
      throw new Error(
        "No username found in env: WP_ADMIN_USER, WP_ADMIN_USERNAME, WP_USER or WP_API_USER",
      );
    }

    return username;
  }

  private async getDefaultLocalAuthorId(): Promise<string> {
    const username = this.getLocalUsername();
    return this.getLocalAuthorId(username);
  }

  private async getLocalAuthorId(username: string): Promise<string> {
    const result = await this.wp(["user", "get", username, "--field=ID"]);

    if (result.exitCode !== 0) {
      throw utils.formatWpCliFailure(
        `Failed to resolve author id for "${username}"`,
        result,
      );
    }

    const authorId = (result.stdout || "").trim();

    if (!authorId) {
      throw new Error(`Author id not found for "${username}"`);
    }

    return authorId;
  }

  private async findRemoteUser(
    restConfig: rest.RestConfig,
    username: string,
  ): Promise<any> {
    const users = await rest.wpRest<any[]>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/users?search=${encodeURIComponent(username)}`,
    );

    const user = users.find(
      (item) => item.slug === username || item.name === username,
    );

    if (!user?.id) {
      throw new Error(`User not found: ${username}`);
    }

    return user;
  }
}
