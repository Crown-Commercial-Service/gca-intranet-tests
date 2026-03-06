import Chance from "chance";
import type WpCustomizer from "../helpers/WpCustomizer";

const chance = new Chance();

export type QuickLinkItemProps = {
  text: string;
  url: string;
};

export type QuickLinksProps = {
  title: string;
  description: string;
  links: QuickLinkItemProps[];
};

export default class QuickLinks {
  readonly title: string;
  readonly description: string;
  readonly links: QuickLinkItemProps[];

  constructor(props: QuickLinksProps) {
    this.title = props.title;
    this.description = props.description;
    this.links = props.links;
  }

  static quickLinks(): QuickLinksBuilder {
    return new QuickLinksBuilder();
  }

  async apply(customizer: WpCustomizer): Promise<void> {
    await customizer.applyQuickLinks(this);
  }
}

class QuickLinksBuilder {
  private props: QuickLinksProps = {
    title: "Quick links",
    description: chance.sentence({ words: 8 }).trim(),
    links: [
      {
        text: "Quick link 1",
        url: "https://example.com/1",
      },
    ],
  };

  withTitle(title: string): this {
    this.props.title = title.trim();
    return this;
  }

  withDescription(description: string): this {
    this.props.description = description.trim();
    return this;
  }

  withTitleMaxChars(max: number): this {
    this.props.title = chance.word({ length: max + 5 }).trim();
    return this;
  }

  withDescriptionMaxChars(max: number): this {
    this.props.description = chance.word({ length: max + 5 }).trim();
    return this;
  }

  withLink1(text: string, url: string): this {
    this.setLinkAtIndex(0, text, url);
    return this;
  }

  withLink2(text: string, url: string): this {
    this.setLinkAtIndex(1, text, url);
    return this;
  }

  withLink3(text: string, url: string): this {
    this.setLinkAtIndex(2, text, url);
    return this;
  }

  build(): QuickLinks {
    return new QuickLinks({
      ...this.props,
      links: [...this.props.links],
    });
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

  get links() {
    return this.props.links;
  }

  private setLinkAtIndex(index: number, text: string, url: string): void {
    if (index < 0 || index > 2) {
      throw new Error("Quick links only supports 3 links.");
    }

    const links = [...this.props.links];

    while (links.length <= index) {
      links.push({
        text: `Quick link ${links.length + 1}`,
        url: `https://example.com/${links.length + 1}`,
      });
    }

    links[index] = {
      text: text.trim(),
      url: url.trim(),
    };

    this.props.links = links.slice(0, 3);
  }
}
