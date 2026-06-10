import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { htmlToText } from "html-to-text";

dayjs.extend(customParseFormat);

export function formatDateNew(value: string | Date): string {
  return dayjs(value).format("D MMMM YYYY");
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

export function toEditorDate(value: string): string {
  const parsed = dayjs(value, [
    "DD-MM-YYYY h:mm a",
    "DD-MM-YYYY HH:mm",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD 00:00:00",
  ]);

  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : value;
}

export function formatHomepageEventDate(value: string | Date): string {
  return dayjs(value, "DD-MM-YYYY").format("D MMMM YYYY");
}

export function formatEventDate(value: string): string {
  return dayjs(value, "DD-MM-YYYY").format("D MMMM YYYY");
}

export function formatEventTime(value: string): string {
  return dayjs(value, "HH:mm").format("h:mma");
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
