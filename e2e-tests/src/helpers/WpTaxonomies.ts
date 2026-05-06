import * as rest from "../lib/wp-rest-client";
import * as docker from "../lib/wp-docker-client";

export type WpTerm = {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
  acf?: Record<string, unknown>;
  [key: string]: unknown;
};

export default class WpTaxonomies {
  constructor(
    private readonly wp: (args: string[]) => Promise<any>,
  ) {}

  async findTermBySlug(taxonomy: string, slug: string): Promise<WpTerm> {
    this.assertRemote();
    const restConfig = rest.getRestConfig();
    const terms = await rest.wpRest<WpTerm[]>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/${taxonomy}?slug=${encodeURIComponent(slug)}`,
    );

    if (!terms?.length) {
      throw new Error(
        `Term not found in taxonomy "${taxonomy}" with slug "${slug}"`,
      );
    }

    return terms[0];
  }

  async getTerm(taxonomy: string, termId: number): Promise<WpTerm> {
    this.assertRemote();
    const restConfig = rest.getRestConfig();
    return rest.wpRest<WpTerm>(
      restConfig,
      "GET",
      `/wp-json/wp/v2/${taxonomy}/${termId}`,
    );
  }

  async updateTermAcf(
    taxonomy: string,
    termId: number,
    acf: Record<string, unknown>,
  ): Promise<WpTerm> {
    this.assertRemote();
    const restConfig = rest.getRestConfig();
    return rest.wpRest<WpTerm>(
      restConfig,
      "POST",
      `/wp-json/wp/v2/${taxonomy}/${termId}`,
      { acf },
    );
  }

  private assertRemote(): void {
    if (docker.wpDriver() !== "remote") {
      throw new Error(
        "WpTaxonomies currently only supports the remote (REST) driver. Set WP_DRIVER=remote.",
      );
    }
  }
}
