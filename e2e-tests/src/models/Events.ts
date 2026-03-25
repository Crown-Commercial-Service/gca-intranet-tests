import Chance from "chance";
import dayjs from "dayjs";
import { buildRealisticBodyContent } from "../utils/contentFactory";

const chance = new Chance();

export type EventStatus = "draft" | "publish" | "private" | "pending";

export type EventProps = {
  title: string;
  content: string;
  status: EventStatus;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
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
  readonly endDate?: string;
  readonly ctaLabel?: string;
  readonly ctaDestination?: string;
  readonly category?: string;
  readonly eventLocation?: string;
  readonly startTime?: string;
  readonly endTime?: string;

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
    this.startTime = props.startTime;
    this.endTime = props.endTime;
  }

  static anEvent(): EventBuilder {
    return new EventBuilder();
  }

  static homepageEvents(): Event[] {
    return [
      Event.anEvent()
        .withFixedTitle("Accessibility Support Session")
        .withCategory("Accessibility")
        .withEventLocation("Online")
        .withStartDate(dayjs().add(1, "day").format("DD-MM-YYYY"))
        .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY"))
        .withCtaLabel("Book Now")
        .withCtaDestination("https://www.example.com/booknow")
        .withStatus("publish")
        .build(),

      Event.anEvent()
        .withFixedTitle("Digital Strategy Workshop")
        .withCategory("Digital and data")
        .withEventLocation("In-person")
        .withStartDate(dayjs().add(3, "day").format("DD-MM-YYYY"))
        .withEndDate(dayjs().add(4, "day").format("DD-MM-YYYY"))
        .withCtaLabel("Book Now")
        .withCtaDestination("https://www.example.com/booknow")
        .withStatus("publish")
        .build(),

      Event.anEvent()
        .withFixedTitle("HR Policy Briefing")
        .withCategory("HR")
        .withEventLocation("Online")
        .withStartDate(dayjs().add(5, "day").format("DD-MM-YYYY"))
        .withCtaLabel("Book Now")
        .withCtaDestination("https://www.example.com/booknow")
        .withEndDate(dayjs().add(6, "day").format("DD-MM-YYYY"))
        .withStatus("publish")
        .build(),
    ];
  }

  static homepageEventsStable(): Event[] {
    return [
      Event.anEvent()
        .withFixedTitle("Accessibility Support Session")
        .withContent("Stable event content 1")
        .withCategory("Accessibility")
        .withEventLocation("Online")
        .withStartDate("10-06-2026")
        .withEndDate("11-06-2026")
        .withStatus("publish")
        .build(),

      Event.anEvent()
        .withFixedTitle("Digital Strategy Workshop")
        .withContent("Stable event content 2")
        .withCategory("Digital and data")
        .withEventLocation("In-person")
        .withStartDate("12-06-2026")
        .withEndDate("13-06-2026")
        .withStatus("publish")
        .build(),

      Event.anEvent()
        .withFixedTitle("HR Policy Briefing")
        .withContent("Stable event content 3")
        .withCategory("HR")
        .withEventLocation("Online")
        .withStartDate("14-06-2026")
        .withEndDate("15-06-2026")
        .withStatus("publish")
        .build(),
    ];
  }

  static manyEvents(count: number, titlePrefix: string = "E2E Event"): Event[] {
    return Array.from({ length: count }, (_, index) =>
      Event.anEvent()
        .withFixedTitle(`${titlePrefix} ${index + 1}`)
        .withParagraphMaxChars(120)
        .withStartInDays(index + 1)
        .withEndInDays(index + 2)
        .withCategory("Accessibility")
        .withEventLocation("Online")
        .withStatus("publish")
        .build(),
    );
  }
}

class EventBuilder {
  private props: EventProps = {
    title: chance.sentence({ words: 5 }).replace(/\.$/, ""),
    content: chance.paragraph({ sentences: 3 }),
    status: "draft",
    startDate: dayjs().add(1, "day").format("DD-MM-YYYY"),
    endDate: undefined,
    startTime: undefined,
    endTime: undefined,
    category: "Leave, absence and flexible working",
    eventLocation: "In-person",
  };

  withFixedTitle(title: string): this {
    this.props.title = title;
    return this;
  }

  withParagraphMaxChars(max: number): this {
    this.props.content = this.randomParagraphWithin(max);
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

  withStartTime(time: string): this {
    this.props.startTime = time;
    return this;
  }

  withEndTime(time: string): this {
    this.props.endTime = time;
    return this;
  }

  withStartInDays(days: number): this {
    this.props.startDate = dayjs().add(days, "day").format("DD-MM-YYYY");
    return this;
  }

  withEndInDays(days: number): this {
    this.props.endDate = dayjs().add(days, "day").format("DD-MM-YYYY");
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

  get startTime() {
    return this.props.startTime;
  }

  get endTime() {
    return this.props.endTime;
  }

  build(): Event {
    return new Event({ ...this.props });
  }

  private randomParagraphWithin(max: number): string {
    if (max <= 0) return "";

    const paragraph = chance.paragraph({ sentences: 3 }).trim();

    return paragraph.length <= max
      ? paragraph
      : paragraph.slice(0, max).trimEnd();
  }
}
