import Chance from "chance";
import type WpCustomizer from "../helpers/WpCustomizer";

const chance = new Chance();

export type TakeALookProps = {
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
};

export default class TakeALook {
  readonly title: string;
  readonly description: string;
  readonly linkText: string;
  readonly linkUrl: string;

  constructor(props: TakeALookProps) {
    this.title = props.title;
    this.description = props.description;
    this.linkText = props.linkText;
    this.linkUrl = props.linkUrl;
  }

  static aTakeALook(): TakeALookBuilder {
    return new TakeALookBuilder();
  }

  async apply(customizer: WpCustomizer): Promise<void> {
    await customizer.applyTakeALook(this);
  }
}

class TakeALookBuilder {
  private props: TakeALookProps = {
    title: "Take a look",
    description: chance.sentence({ words: 8 }).trim(),
    linkText: "Learn more",
    linkUrl: "https://example.com",
  };

  withTitle(title: string): this {
    this.props.title = title.trim();
    return this;
  }

  withDescription(description: string): this {
    this.props.description = description.trim();
    return this;
  }

  withLinkText(linkText: string): this {
    this.props.linkText = linkText.trim();
    return this;
  }

  withLinkUrl(url: string): this {
    this.props.linkUrl = url.trim();
    return this;
  }

  withTitleMaxChars(max: number): this {
    this.props.title = this.randomWithin(max);
    return this;
  }

  withDescriptionMaxChars(max: number): this {
    this.props.description = this.randomWithin(max);
    return this;
  }

  withLinkTextMaxChars(max: number): this {
    this.props.linkText = this.randomWithin(max);
    return this;
  }

  build(): TakeALook {
    return new TakeALook({ ...this.props });
  }

  async apply(customizer: WpCustomizer): Promise<void> {
    await this.build().apply(customizer);
  }

  get title() {
    return this.props.title;
  }

  get description() {
    return this.props.description;
  }

  get linkText() {
    return this.props.linkText;
  }

  get linkUrl() {
    return this.props.linkUrl;
  }

  private randomWithin(max: number): string {
    if (max <= 0) return "";

    const txt = chance
      .sentence({ words: Math.max(3, Math.floor(max / 6)) })
      .trim();

    return txt.length <= max ? txt : txt.slice(0, max).trimEnd();
  }
}
