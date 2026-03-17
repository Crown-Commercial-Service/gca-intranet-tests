import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { htmlToText } from "html-to-text";

dayjs.extend(customParseFormat);

function getOrdinal(dayNumber: number) {
  if (dayNumber > 3 && dayNumber < 21) return "th";
  switch (dayNumber % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatPostDate(date: Date): string {
  const parsedDate = dayjs(date);
  const dayOfMonth = parsedDate.date();
  const ordinal = getOrdinal(dayOfMonth);

  return `${dayOfMonth}${ordinal} ${parsedDate.format("MMMM YYYY")}`;
}

/**
 * Convert WP HTML (excerpt/content) into a predictable plain-text string for assertions.
 */
export function htmlToPlainText(html: string): string {
  const plainText = htmlToText(html ?? "", {
    wordwrap: false,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  });

  return plainText.replace(/\s+/g, " ").trim();
}

/**
 * Returns the visible portion of a truncated string
 * (removes trailing "..." if present).
 */
export function getVisibleTruncatedText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.endsWith("...")) {
    return normalized.slice(0, -3).trim();
  }

  if (normalized.endsWith("…")) {
    return normalized.slice(0, -1).trim();
  }

  return normalized;
}

export function toEditorDateTime(value: string): string {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?$/,
  );

  if (!match) {
    return value;
  }

  const [, year, month, day, hourRaw, minute] = match;
  const hour = Number(hourRaw);

  const suffix = hour >= 12 ? "pm" : "am";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${day}-${month}-${year} ${twelveHour}:${minute} ${suffix}`;
}

export function toEditorDate(value: string): string {
  const parsed = dayjs(value, [
    "DD-MM-YYYY h:mm a",
    "DD-MM-YYYY HH:mm",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD 00:00:00",
  ]);

  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : value;
}

export function toEditorTime(value: string): string {
  const parsed = dayjs(value, [
    "DD-MM-YYYY h:mm a",
    "DD-MM-YYYY HH:mm",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD 00:00:00",
  ]);

  return parsed.isValid() ? parsed.format("HH:mm") : value;
}

export function formatHomepageArticleDate(value: string | Date): string {
  return dayjs(value).format("Do MMMM YYYY");
}

export function formatHomepageEventDate(value: string | Date): string {
  return dayjs(value, "DD-MM-YYYY").format("D MMMM YYYY");
}

export function formatEventDate(value: string): string {
  return dayjs(value, "DD-MM-YYYY").format("D MMMM YYYY");
}

export function formatEventTime(value: string): string {
  return dayjs(value, "HH:mm").format("h:mm a");
}

export function buildExpectedEventDateText(event: {
  startDate: string;
  endDate?: string;
}): string {
  const startDate = formatEventDate(event.startDate);

  if (event.endDate) {
    const endDate = formatEventDate(event.endDate);
    return `Date: ${startDate} to ${endDate}`;
  }

  return `Date: ${startDate}`;
}

export function buildExpectedEventTimeText(event: {
  startTime?: string;
  endTime?: string;
}): string | null {
  const startTime = event.startTime ? formatEventTime(event.startTime) : "";
  const endTime = event.endTime ? formatEventTime(event.endTime) : "";

  if (startTime && endTime) {
    return `Time: ${startTime} to ${endTime}`;
  }

  if (startTime) {
    return `Time: ${startTime}`;
  }

  if (endTime) {
    return `Time: Until ${endTime}`;
  }

  return null;
}
