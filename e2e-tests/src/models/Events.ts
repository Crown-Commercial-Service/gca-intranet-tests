import Chance from "chance";

const chance = new Chance();

export type EventStatus = "draft" | "publish" | "private" | "pending";

export type EventProps = {
  title: string;
  content: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  category?: string;
  ctaLabel?: string;
  ctaDestination?: string;
};

export default class Event {
  readonly title: string;
  readonly content: string;
  readonly status: EventStatus;
  readonly startDate: string;
  readonly endDate: string;
  readonly ctaLabel?: string;
  readonly ctaDestination?: string;
  readonly category?: string;

  constructor(props: EventProps) {
    this.title = props.title;
    this.content = props.content;
    this.status = props.status;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.ctaLabel = props.ctaLabel;
    this.ctaDestination = props.ctaDestination;
    this.category = props.category;
  }

  static anEvent(): EventBuilder {
    return new EventBuilder();
  }
}

class EventBuilder {
  private props: EventProps = {
    title: chance.sentence({ words: 5 }).replace(/\.$/, ""),
    content: chance.paragraph({ sentences: 3 }),
    status: "draft",
    startDate: "18-03-2026 12:00 am",
    endDate: "21-03-2031 12:00 am",
  };

  withFixedTitle(title: string): this {
    this.props.title = title;
    return this;
  }

  withContent(content: string): this {
    this.props.content = content;
    return this;
  }

  withStatus(status: EventStatus): this {
    this.props.status = status;
    return this;
  }

  withStartDate(date: string): this {
    this.props.startDate = date;
    return this;
  }

  withEndDate(date: string): this {
    this.props.endDate = date;
    return this;
  }

  withCtaLabel(label: string): this {
    this.props.ctaLabel = label;
    return this;
  }

  withCategory(category: string): this {
    this.props.category = category;
    return this;
  }

  withCtaDestination(url: string): this {
    this.props.ctaDestination = url;
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

  get startDate() {
    return this.props.startDate;
  }

  get endDate() {
    return this.props.endDate;
  }

  get ctaLabel() {
    return this.props.ctaLabel;
  }

  get ctaDestination() {
    return this.props.ctaDestination;
  }

  build(): Event {
    return new Event({ ...this.props });
  }
}
