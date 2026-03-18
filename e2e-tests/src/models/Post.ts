import Chance from "chance";
import dayjs from "dayjs";
import { buildRealisticBodyContent } from "../utils/contentFactory";

const chance = new Chance();

export type HomepageContent = {
  news: Post[];
  workUpdates: [Post, Post];
  blog: Post;
};

export type PostStatus = "draft" | "publish" | "private" | "pending";

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
  label?: string;
  excerpt?: string;
  slug?: string;
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
  readonly label?: string;
  readonly excerpt?: string;
  readonly slug?: string;

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
    this.label = props.label;
    this.excerpt = props.excerpt;
    this.slug = props.slug;
  }

  static aPost(): PostBuilder {
    return new PostBuilder().withType("post");
  }

  static aPage(): PostBuilder {
    return new PostBuilder().withType("page");
  }

  static aWorkUpdate(): PostBuilder {
    return new PostBuilder().withType("work_updates");
  }

  static manyNews(
    count: number,
    titlePrefix: string = "E2E Latest Article",
  ): Post[] {
    return Array.from({ length: count }, (_, index) =>
      Post.aPost()
        .withType("news")
        .withFixedTitle(`${titlePrefix} ${index + 1}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .build(),
    );
  }

  static manyWorkUpdates(
    count: number,
    titlePrefix: string = "E2E Work Update",
  ): Post[] {
    return Array.from({ length: count }, (_, index) =>
      Post.aWorkUpdate()
        .withFixedTitle(`${titlePrefix} ${index + 1}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .build(),
    );
  }

  static manyBlogs(
    count: number,
    titlePrefix: string = "E2E Blog Post",
  ): Post[] {
    return Array.from({ length: count }, (_, index) =>
      Post.aPost()
        .withType("blogs")
        .withFixedTitle(`${titlePrefix} ${index + 1}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .build(),
    );
  }

  static homepageSet(runId?: string): HomepageContent {
    const applyRunId = (builder: PostBuilder) => {
      if (runId) {
        builder.withRunId(runId);
      }
      return builder;
    };

    const news = [
      applyRunId(
        Post.aPost()
          .withType("news")
          .withFixedTitle("E2E News Post 1")
          .withParagraphMaxChars(180)
          .withStatus("publish")
          .withFeaturedImage("img-1.jpg"),
      ).build(),

      applyRunId(
        Post.aPost()
          .withType("news")
          .withFixedTitle("E2E News Post 2")
          .withParagraphMaxChars(180)
          .withStatus("publish")
          .withFeaturedImage("img-2.jpg"),
      ).build(),

      applyRunId(
        Post.aPost()
          .withType("news")
          .withFixedTitle("E2E News Post 3")
          .withParagraphMaxChars(180)
          .withStatus("publish")
          .withFeaturedImage("img-3.jpg"),
      ).build(),

      applyRunId(
        Post.aPost()
          .withType("news")
          .withFixedTitle("E2E News Post 4")
          .withParagraphMaxChars(180)
          .withStatus("publish")
          .withFeaturedImage("img-4.jpg"),
      ).build(),
    ];

    const workUpdates: [Post, Post] = [
      applyRunId(
        Post.aPost()
          .withType("work_updates")
          .withFixedTitle("E2E Work Update 1")
          .withParagraphMaxChars(180)
          .withStatus("publish"),
      ).build(),

      applyRunId(
        Post.aPost()
          .withType("work_updates")
          .withFixedTitle("E2E Work Update 2")
          .withParagraphMaxChars(180)
          .withStatus("publish"),
      ).build(),
    ];

    const blog = applyRunId(Post.aPost().withType("blogs"))
      .withFixedTitle("E2E Blog Post")
      .withParagraphMaxChars(180)
      .withStatus("publish")
      .build();

    return {
      news,
      workUpdates,
      blog,
    };
  }
}

class PostBuilder {
  private runId?: string;

  private props: PostProps = {
    title: this.randomTitleWithin(60),
    content: this.randomParagraphWithin(400),
    status: "draft",
    type: "post",
    createdAt: dayjs().toDate(),
    category: undefined,
    template: undefined,
    excerpt: this.randomParagraphWithin(140),
    slug: this.randomSlug(),
  };

  private applyRunId(value: string): string {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private syncSlugFromTitle(): void {
    this.props.slug = this.toSlug(this.props.title);
  }

  private randomSlug(): string {
    return this.toSlug(chance.sentence({ words: 4 }).replace(/\.$/, ""));
  }

  withRunId(runId: string): this {
    this.runId = runId;
    this.props.title = this.applyRunId(this.props.title);
    this.syncSlugFromTitle();
    return this;
  }

  withTitle(title: string): this {
    this.props.title = this.applyRunId(title);
    this.syncSlugFromTitle();
    return this;
  }

  withFixedTitle(title: string): this {
    this.props.title = this.applyRunId(title);
    this.syncSlugFromTitle();
    return this;
  }

  withTitleOver100Chars(): this {
    this.props.title = this.applyRunId(this.randomTitleExact(120));
    this.syncSlugFromTitle();
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

  withLabel(label: string): this {
    this.props.label = label;
    return this;
  }

  withTitleMaxChars(max: number): this {
    this.props.title = this.applyRunId(this.randomTitleWithin(max));
    this.syncSlugFromTitle();
    return this;
  }

  withTitleExactChars(exact: number): this {
    this.props.title = this.applyRunId(this.randomTitleExact(exact));
    this.syncSlugFromTitle();
    return this;
  }

  withTitleOverLimit(limit: number, overBy: number = 1): this {
    this.props.title = this.applyRunId(this.randomTitleExact(limit + overBy));
    this.syncSlugFromTitle();
    return this;
  }

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

  withRealisticBodyContent(type: "compact" | "short" | "long" = "short"): this {
    this.props.content = buildRealisticBodyContent(type);
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

  get excerpt() {
    return this.props.excerpt;
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

  get slug() {
    return this.props.slug;
  }

  build(): Post {
    const props: PostProps = { ...this.props };
    props.title = this.applyRunId(props.title);

    if (!props.slug) {
      props.slug = this.toSlug(props.title);
    }

    return new Post(props);
  }

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
      title += ` ${chance.word()}`;
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
      paragraph += ` ${chance.sentence({ words: 5 })}`;
    }

    return paragraph.slice(0, exact);
  }
}
