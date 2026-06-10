import type Event from "../models/Events";
import * as rest from "../lib/wp-rest-client";
import logger from "../utils/logger";

export default class WpEvents {
  async create(event: Event): Promise<number> {
    const restConfig = rest.getRestConfig();

    logger.info(
      {
        postType: "events",
        baseUrl: restConfig.baseUrl,
      },
      "Creating WordPress event via REST API",
    );

    const created = await rest.wpRest<any>(
      restConfig,
      "POST",
      "/wp-json/wp/v2/events",
      {
        title: event.title,
        content: event.content,
        status: event.status,
        meta: {
          start_datetime: event.startDate,
          end_datetime: event.endDate,
          secondary_cta_label: event.ctaLabel ?? "",
          secondary_cta_destination: event.ctaDestination ?? "",
        },
      },
    );

    const postId = Number(created?.id);

    if (!Number.isFinite(postId)) {
      throw new Error(
        `Failed to parse event id from API: ${JSON.stringify(created)}`,
      );
    }

    return postId;
  }

  async createMany(events: Event[]): Promise<number[]> {
    return Promise.all(events.map((event) => this.create(event)));
  }
}
