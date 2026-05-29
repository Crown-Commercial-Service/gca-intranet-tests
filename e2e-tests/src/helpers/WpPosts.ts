import type Post from "../models/Post";

import * as utils from "../utils/wp-utils";
import * as rest from "../lib/wp-rest-client";

export default class WpPosts {
  async create(post: Post): Promise<number> {
    return this.createOne(post);
  }

  async createMany(posts: Post[]): Promise<number[]> {
    return Promise.all(posts.map((post) => this.createOne(post)));
  }

  async createPages(pages: Post[]): Promise<void> {
    for (const page of pages) {
      await this.createOne(page);
    }
  }

  async clearByRunId(runId: string): Promise<void> {
    if (!runId) return;

    const restConfig = rest.getRestConfig();
    const endpoints = ["posts", "pages", "work_updates", "blogs", "news", "media"];

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
  }

  async clearByTypeAndAuthor(postType: string): Promise<void> {
    const username = this.getRemoteUsername();
    const restConfig = rest.getRestConfig();
    const user = await this.findRemoteUser(restConfig, username);

    const endpoint =
      postType === "attachment" ? "media" : rest.restEndpointForType(postType);

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
  }

  async clearByType(postType: string): Promise<void> {
    const restConfig = rest.getRestConfig();

    const endpoint =
      postType === "attachment" ? "media" : rest.restEndpointForType(postType);

    const items = await rest.wpRest<any[]>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/${endpoint}?per_page=100`,
    );

    for (const item of items) {
      await rest.wpRest(
        restConfig,
        "DELETE",
        `/wp-json/wp/v2/${endpoint}/${item.id}?force=true`,
      );
    }
  }

  async getPostLink(postId: number, postType: string): Promise<string> {
    const restConfig = rest.getRestConfig();
    const endpoint = rest.restEndpointForType(postType);

    const post = await rest.wpRest<any>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/${endpoint}/${postId}?_fields=link`,
    );

    const link = String(post?.link || "").trim();
    if (!link) {
      throw new Error(`Failed to resolve link for post ${postId}`);
    }

    return link;
  }

  async updatePostAuthor(
    postId: number,
    postType: string,
    username: string,
  ): Promise<void> {
    const restConfig = rest.getRestConfig();
    const user = await this.findRemoteUser(restConfig, username);

    await rest.wpRest(
      restConfig,
      "POST",
      `/wp-json/wp/v2/${rest.restEndpointForType(postType)}/${postId}`,
      { author: user.id },
    );
  }

  private async createOne(post: Post): Promise<number> {
    const isPage = String(post.type) === "page";
    const shouldApplyCategory = Boolean(post.category);
    const shouldApplyTemplate = isPage && Boolean(post.template);

    const templateValue = shouldApplyTemplate
      ? this.resolveTemplateValue(String(post.template))
      : undefined;

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

    const created = await rest.wpRest<any>(restConfig, "POST", endpoint, {
      title: post.title,
      content: post.content,
      status: post.status,
      date_gmt: new Date(post.createdAt).toISOString(),
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

  private getRemoteUsername(): string {
    const username = (process.env.WP_API_USER || "").trim();

    if (!username) {
      throw new Error("No username found in env: WP_API_USER");
    }

    return username;
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
