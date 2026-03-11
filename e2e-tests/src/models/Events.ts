import Chance from "chance";
import dayjs from "dayjs";

const chance = new Chance();

export type EventStatus = "draft" | "publish" | "private" | "pending";

export type EventProps = {
  title: string;
  content: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  category?: string;
  eventLocation?: string;
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
  readonly eventLocation?: string;

  constructor(props: EventProps) {
    this.title = props.title;
    this.content = props.content;
    this.status = props.status;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.ctaLabel = props.ctaLabel;
    this.ctaDestination = props.ctaDestination;
    this.category = props.category;
    this.eventLocation = props.eventLocation;
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

    // store ISO format internally
    startDate: dayjs().add(1, "day").format("YYYY-MM-DD 00:00:00"),
    endDate: dayjs().add(3, "day").format("YYYY-MM-DD 00:00:00"),

    category: "Leave, absence and flexible",
    eventLocation: "In-person",
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

  withStartInDays(days: number): this {
    this.props.startDate = dayjs()
      .add(days, "day")
      .format("YYYY-MM-DD 00:00:00");
    return this;
  }

  withEndInDays(days: number): this {
    this.props.endDate = dayjs().add(days, "day").format("YYYY-MM-DD 00:00:00");
    return this;
  }

  withCtaLabel(label: string): this {
    this.props.ctaLabel = label;
    return this;
  }

  withCtaDestination(url: string): this {
    this.props.ctaDestination = url;
    return this;
  }

  withCategory(category: string): this {
    this.props.category = category;
    return this;
  }

  withEventLocation(location: string): this {
    this.props.eventLocation = location;
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

  get category() {
    return this.props.category;
  }

  get eventLocation() {
    return this.props.eventLocation;
  }

  build(): Event {
    return new Event({ ...this.props });
  }
}
