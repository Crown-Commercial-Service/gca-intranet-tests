import * as docker from "../../src/lib/wp-docker-client";
import type { WpResult } from "../../src/utils/wp-utils";
import * as utils from "../../src/utils/wp-utils";
import type TakeALook from "../../src/models/TakeALook";
import { expect } from "../../src/wp.fixtures";

type WpRunner = (args: string[]) => Promise<WpResult>;

export default class WpCustomizer {
  constructor(private readonly wp: WpRunner) {}

  /**
   * Generic entry point for applying customizer changes.
   */
  async applyCustomization(customization: {
    apply(customizer: WpCustomizer): Promise<void>;
  }): Promise<void> {
    this.ensureLocalCliOnly();
    await customization.apply(this);
  }

  /**
   * Apply Take a look customizer configuration
   */
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

  /**
   * Retrieve a theme mod value
   */
  async getThemeMod(key: string): Promise<string> {
    this.ensureLocalCliOnly();

    const res = await this.wp(["theme", "mod", "get", key]);

    return (res.stdout || "").trim();
  }

  /**
   * Set a theme mod via wp-cli
   */
  private async setThemeMod(key: string, value: string): Promise<void> {
    const res = await this.wp(["theme", "mod", "set", key, value]);

    expect(res.exitCode, res.stderr).toBe(0);
  }

  /**
   * Remove a theme mod
   */
  private async removeThemeMod(key: string): Promise<void> {
    const res = await this.wp(["theme", "mod", "remove", key]);

    if (res.exitCode !== 0) {
      throw utils.formatWpCliFailure(
        `Failed to remove theme mod "${key}"`,
        res,
      );
    }
  }

  /**
   * Ensure we are using wp-cli (docker driver)
   */
  private ensureLocalCliOnly(): void {
    expect(
      docker.wpDriver(),
      "WpCustomizer only supports WP_DRIVER=docker (wp-cli). Remote customizer updates are not supported.",
    ).toBe("docker");
  }
}
