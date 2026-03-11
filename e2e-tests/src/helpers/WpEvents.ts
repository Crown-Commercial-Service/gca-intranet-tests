import type Event from "../models/Events";
import * as utils from "../utils/wp-utils";

export default class WpEvents {
  constructor(
    private readonly wp: (args: string[]) => Promise<utils.WpResult>,
  ) {}

  async create(event: Event): Promise<number> {
    const authorId = await this.getDefaultAuthorId();

    const createResult = await this.wp([
      "post",
      "create",
      "--porcelain",
      "--post_type=event",
      `--post_title=${event.title}`,
      `--post_content=${event.content}`,
      `--post_status=${event.status}`,
      `--post_author=${authorId}`,
    ]);

    if (createResult.exitCode !== 0) {
      throw utils.formatWpCliFailure("Failed to create event", createResult);
    }

    const postId = Number((createResult.stdout || "").trim());

    if (!Number.isFinite(postId)) {
      throw new Error(
        `Failed to parse event id from CLI: ${createResult.stdout}`,
      );
    }

    await this.setMeta(postId, "start_datetime", event.startDate);
    await this.setMeta(
      postId,
      "_start_datetime",
      "202603101020a_202603101020b",
    );

    await this.setMeta(postId, "end_datetime", event.endDate);
    await this.setMeta(postId, "_end_datetime", "202603101020a_202603101020c");

    await this.setMeta(postId, "secondary_cta_label", event.ctaLabel ?? "");
    await this.setMeta(
      postId,
      "_secondary_cta_label",
      "202603101020a_202603101020d",
    );

    await this.setMeta(
      postId,
      "secondary_cta_destination",
      event.ctaDestination ?? "",
    );
    await this.setMeta(
      postId,
      "_secondary_cta_destination",
      "202603101020a_202603101020e",
    );

    return postId;
  }

  private async getDefaultAuthorId(): Promise<string> {
    const username = (
      process.env.WP_ADMIN_USER ||
      process.env.WP_ADMIN_USERNAME ||
      process.env.WP_USER ||
      process.env.WP_API_USER ||
      ""
    ).trim();

    if (!username) {
      throw new Error(
        "Missing author username. Set one of: WP_ADMIN_USER, WP_ADMIN_USERNAME, WP_USER, WP_API_USER",
      );
    }

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

  private async setMeta(
    postId: number,
    key: string,
    value: string,
  ): Promise<void> {
    const result = await this.wp([
      "post",
      "meta",
      "update",
      String(postId),
      key,
      value,
    ]);

    if (result.exitCode !== 0) {
      throw utils.formatWpCliFailure(
        `Failed to update event meta "${key}"`,
        result,
      );
    }
  }
}
