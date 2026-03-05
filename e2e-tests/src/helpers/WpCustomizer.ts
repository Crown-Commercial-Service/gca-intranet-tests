import * as docker from "../lib/wp-docker-client";
import type { WpResult } from "../utils/wp-utils";
import * as utils from "../utils/wp-utils";
import type TakeALook from "../models/TakeALook";

type WpRunner = (args: string[]) => Promise<WpResult>;

export type TakeALookConfig = {
  enabled?: boolean;
  title?: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
};

export default class WpCustomizer {
  constructor(private readonly wp: WpRunner) {}

  async setTakeALook(config: TakeALookConfig): Promise<void>;
  async setTakeALook(takeALook: TakeALook): Promise<void>;
  async setTakeALook(input: TakeALookConfig | TakeALook): Promise<void> {
    this.ensureLocalCliOnly();

    const config: TakeALookConfig =
      input &&
      typeof input === "object" &&
      "linkText" in input &&
      "linkUrl" in input
        ? {
            title: input.title,
            description: input.description,
            linkText: input.linkText,
            linkUrl: input.linkUrl,
          }
        : input;

    if (typeof config.enabled === "boolean") {
      await this.setThemeMod(
        "gca_takealook_enabled",
        config.enabled ? "1" : "0",
      );
    }
    if (typeof config.title === "string") {
      await this.setThemeMod("gca_takealook_title", config.title);
    }
    if (typeof config.description === "string") {
      await this.setThemeMod("gca_takealook_desc", config.description);
    }
    if (typeof config.linkText === "string") {
      await this.setThemeMod("gca_takealook_link_text", config.linkText);
    }
    if (typeof config.linkUrl === "string") {
      await this.setThemeMod("gca_takealook_link_url", config.linkUrl);
    }
  }

  async clearTakeALook(): Promise<void> {
    this.ensureLocalCliOnly();

    await this.removeThemeMod("gca_takealook_enabled");
    await this.removeThemeMod("gca_takealook_title");
    await this.removeThemeMod("gca_takealook_desc");
    await this.removeThemeMod("gca_takealook_link_text");
    await this.removeThemeMod("gca_takealook_link_url");
  }

  async getThemeMod(key: string): Promise<string> {
    this.ensureLocalCliOnly();

    const res = await this.wp(["theme", "mod", "get", key]);
    if (res.exitCode !== 0) {
      throw utils.formatWpCliFailure(`Failed to get theme mod "${key}"`, res);
    }
    return (res.stdout || "").trim();
  }

  private async setThemeMod(key: string, value: string): Promise<void> {
    const res = await this.wp(["theme", "mod", "set", key, value]);
    if (res.exitCode !== 0) {
      throw utils.formatWpCliFailure(`Failed to set theme mod "${key}"`, res);
    }
  }

  private async removeThemeMod(key: string): Promise<void> {
    const res = await this.wp(["theme", "mod", "remove", key]);
    if (res.exitCode !== 0) {
      throw utils.formatWpCliFailure(
        `Failed to remove theme mod "${key}"`,
        res,
      );
    }
  }

  private ensureLocalCliOnly(): void {
    if (docker.wpDriver() === "remote") {
      throw new Error(
        "WpCustomizer only supports WP_DRIVER=docker (wp-cli). Remote customizer updates are not supported.",
      );
    }
  }
}
