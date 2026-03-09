import * as docker from "../../src/lib/wp-docker-client";
import type { WpResult } from "../../src/utils/wp-utils";
import * as utils from "../../src/utils/wp-utils";
import * as rest from "../../src/lib/wp-rest-client";

import type TakeALook from "../../src/models/TakeALook";
import type QuickLinks from "../../src/models/QuickLinks";

import { expect } from "../../src/wp.fixtures";

type WpRunner = (args: string[]) => Promise<WpResult>;

export default class WpCustomizer {
  constructor(private readonly wp: WpRunner) {}

  async applyCustomization(customization: {
    apply(customizer: WpCustomizer): Promise<void>;
  }): Promise<void> {
    await customization.apply(this);
  }

  async applyTakeALook(takeALook: TakeALook): Promise<void> {
    const { title, description, linkText, linkUrl } = takeALook;

    if (typeof title === "string") {
      await this.setThemeMod("gca_takealook_title", title);
    }

    if (typeof description === "string") {
      await this.setThemeMod("gca_takealook_desc", description);
    }

    if (typeof linkText === "string") {
      await this.setThemeMod("gca_takealook_link_text", linkText);
    }

    if (typeof linkUrl === "string") {
      await this.setThemeMod("gca_takealook_link_url", linkUrl);
    }
  }

  async applyQuickLinks(quickLinks: QuickLinks): Promise<void> {
    const { title, description, links } = quickLinks;

    if (typeof title === "string") {
      await this.setThemeMod("gca_quicklinks_title", title);
    }

    if (typeof description === "string") {
      await this.setThemeMod("gca_quicklinks_desc", description);
    }

    for (let i = 0; i < 3; i++) {
      const linkNumber = i + 1;
      const link = links[i];

      await this.setThemeMod(
        `gca_quicklinks_${linkNumber}_text`,
        link?.text ?? "",
      );

      await this.setThemeMod(
        `gca_quicklinks_${linkNumber}_url`,
        link?.url ?? "",
      );
    }
  }

  async getThemeMod(key: string): Promise<string> {
    if (docker.wpDriver() === "remote") {
      const config = rest.getRestConfig();
      const res = await rest.wpRest<any>(
        config,
        "GET",
        "/wp-json/wp/v2/settings",
      );
      return res[key] ?? "";
    }

    const res = await this.wp(["theme", "mod", "get", key]);
    return (res.stdout || "").trim();
  }

  private async setThemeMod(key: string, value: string): Promise<void> {
    if (docker.wpDriver() === "remote") {
      const config = rest.getRestConfig();

      await rest.wpRest(config, "POST", "/wp-json/wp/v2/settings", {
        [key]: value,
      });

      return;
    }

    const result = await this.wp(["theme", "mod", "set", key, value]);

    expect(result.exitCode, result.stderr).toBe(0);
  }

  private async removeThemeMod(key: string): Promise<void> {
    if (docker.wpDriver() === "remote") {
      const config = rest.getRestConfig();

      await rest.wpRest(config, "POST", "/wp-json/wp/v2/settings", {
        [key]: "",
      });

      return;
    }

    const result = await this.wp(["theme", "mod", "remove", key]);

    if (result.exitCode !== 0) {
      throw utils.formatWpCliFailure(
        `Failed to remove theme mod "${key}"`,
        result,
      );
    }
  }
}
