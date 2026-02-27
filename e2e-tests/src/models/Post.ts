import Chance from "chance";

const chance = new Chance();

export type PostStatus = "draft" | "publish" | "private" | "pending";

/**
 * Supports core types + custom post types (e.g. "work-update").
 */
export type PostType = "post" | "page" | (string & {});

export type PostProps = {
  title: string;
  content: string;
  status: PostStatus;
  type: PostType;
  author?: string;
  featuredImagePath?: string;
  createdAt: Date;
  category?: string;
  template?: string;
};

export default class Post {
  readonly title: string;
  readonly content: string;
  readonly status: PostStatus;
  readonly type: PostType;
  readonly author?: string;
  readonly featuredImagePath?: string;
  readonly createdAt: Date;
  readonly category?: string;
  readonly template?: string;

  constructor(props: PostProps) {
    this.title = props.title;
    this.content = props.content;
    this.status = props.status;
    this.type = props.type;
    this.author = props.author;
    this.featuredImagePath = props.featuredImagePath;
    this.createdAt = props.createdAt;
    this.category = props.category;
    this.template = props.template;
  }

  static aPost(): PostBuilder {
    return new PostBuilder().withType("post");
  }

  static aPage(): PostBuilder {
    return new PostBuilder().withType("page");
  }

  /**
   * Custom post type used by GCA.
   */
  static aWorkUpdate(): PostBuilder {
    return new PostBuilder().withType("work_updates");
  }
}

class PostBuilder {
  private runId?: string;

  private props: PostProps = {
    title: this.randomTitleWithin(60),
    content: this.randomParagraphWithin(400),
    status: "draft",
    type: "post",
    createdAt: new Date(),
    category: undefined,
    template: undefined,
  };

  private applyRunId(title: string): string {
    const runId = this.runId || process.env.PW_RUN_ID;
    if (!runId) return title;

    if (title.includes(runId)) return title;

    return `${title} ${runId}`.trim();
  }

  withRunId(runId: string): this {
    this.runId = runId;
    this.props.title = this.applyRunId(this.props.title);
    return this;
  }

  withTitle(title: string): this {
    this.props.title = this.applyRunId(title);
    return this;
  }

  withFixedTitle(title: string): this {
    this.props.title = this.applyRunId(title);
    return this;
  }

  withTitleOver100Chars(): this {
    this.props.title = this.applyRunId(this.randomTitleExact(120));
    return this;
  }

  withContent(content: string): this {
    this.props.content = content;
    return this;
  }

  withStatus(status: PostStatus): this {
    this.props.status = status;
    return this;
  }

  withType(type: PostType): this {
    this.props.type = type;
    return this;
  }

  withAuthor(username: string): this {
    this.props.author = username;
    return this;
  }

  withFeaturedImage(fileName: string): this {
    this.props.featuredImagePath = `assets/images/${fileName}`;
    return this;
  }

  withCreatedAt(date: Date): this {
    this.props.createdAt = date;
    return this;
  }

  withCategory(category: string): this {
    this.props.category = category;
    return this;
  }

  withTemplate(template: string): this {
    this.props.template = template;
    return this;
  }

  // title helpers
  withTitleMaxChars(max: number): this {
    this.props.title = this.applyRunId(this.randomTitleWithin(max));
    return this;
  }

  withTitleExactChars(exact: number): this {
    this.props.title = this.applyRunId(this.randomTitleExact(exact));
    return this;
  }

  withTitleOverLimit(limit: number, overBy: number = 1): this {
    this.props.title = this.applyRunId(this.randomTitleExact(limit + overBy));
    return this;
  }

  // paragraph helpers
  withParagraphMaxChars(max: number): this {
    this.props.content = this.randomParagraphWithin(max);
    return this;
  }

  withParagraphExactChars(exact: number): this {
    this.props.content = this.randomParagraphExact(exact);
    return this;
  }

  withParagraphOverLimit(limit: number, overBy: number = 1): this {
    this.props.content = this.randomParagraphExact(limit + overBy);
    return this;
  }

  get title() {
    return this.props.title;
  }
  get content() {
    return this.props.content;
  }
  get status() {
    return this.props.status;
  }
  get type() {
    return this.props.type;
  }
  get author() {
    return this.props.author;
  }
  get featuredImagePath() {
    return this.props.featuredImagePath;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get category() {
    return this.props.category;
  }

  build(): Post {
    const props: PostProps = { ...this.props };
    props.title = this.applyRunId(props.title);
    return new Post(props);
  }

  // helpers
  private randomTitleWithin(max: number): string {
    if (max <= 0) return "";
    const title = chance
      .sentence({ words: Math.max(3, Math.floor(max / 5)) })
      .trim();
    return title.length <= max ? title : title.slice(0, max).trimEnd();
  }

  private randomTitleExact(exact: number): string {
    if (exact <= 0) return "";
    let title = chance
      .sentence({ words: Math.max(3, Math.floor(exact / 5)) })
      .trim();
    while (title.length < exact) {
      title += " " + chance.word();
    }
    return title.slice(0, exact);
  }

  private randomParagraphWithin(max: number): string {
    if (max <= 0) return "";
    const paragraph = chance.paragraph({ sentences: 3 }).trim();
    return paragraph.length <= max
      ? paragraph
      : paragraph.slice(0, max).trimEnd();
  }

  private randomParagraphExact(exact: number): string {
    if (exact <= 0) return "";
    let paragraph = chance.paragraph({ sentences: 5 }).trim();
    while (paragraph.length < exact) {
      paragraph += " " + chance.sentence({ words: 5 });
    }
    return paragraph.slice(0, exact);
  }
}