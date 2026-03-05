// src/models/TakeALook.ts
import Chance from "chance";

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
}

class TakeALookBuilder {
  private runId?: string;

  private props: TakeALookProps = {
    title: "Take a look",
    description: chance.sentence({ words: 8 }).trim(),
    linkText: "Learn more",
    linkUrl: "https://example.com",
  };

  private applyRunId(value: string): string {
    const runId = this.runId || process.env.PW_RUN_ID;
    const clean = String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

    if (!runId) return clean;
    if (clean.includes(runId)) return clean;

    return `${clean} ${runId}`.trim();
  }

  withRunId(runId: string): this {
    this.runId = runId;
    this.props.title = this.applyRunId(this.props.title);
    this.props.description = this.applyRunId(this.props.description);
    this.props.linkText = this.applyRunId(this.props.linkText);
    // don't append runId to URLs
    return this;
  }

  withTitle(title: string): this {
    this.props.title = this.applyRunId(title);
    return this;
  }

  withDescription(description: string): this {
    this.props.description = this.applyRunId(description);
    return this;
  }

  withLinkText(linkText: string): this {
    this.props.linkText = this.applyRunId(linkText);
    return this;
  }

  withLinkUrl(url: string): this {
    this.props.linkUrl = String(url ?? "").trim();
    return this;
  }

  withTitleMaxChars(max: number): this {
    this.props.title = this.applyRunId(this.randomWithin(max));
    return this;
  }

  withDescriptionMaxChars(max: number): this {
    this.props.description = this.applyRunId(this.randomWithin(max));
    return this;
  }

  withLinkTextMaxChars(max: number): this {
    this.props.linkText = this.applyRunId(this.randomWithin(max));
    return this;
  }

  build(): TakeALook {
    const props: TakeALookProps = { ...this.props };

    props.title = this.applyRunId(props.title);
    props.description = this.applyRunId(props.description);
    props.linkText = this.applyRunId(props.linkText);

    return new TakeALook(props);
  }

  private randomWithin(max: number): string {
    if (max <= 0) return "";
    const txt = chance
      .sentence({ words: Math.max(3, Math.floor(max / 6)) })
      .trim();
    return txt.length <= max ? txt : txt.slice(0, max).trimEnd();
  }
}
