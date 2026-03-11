import dayjs from "dayjs";
import { htmlToText } from "html-to-text";

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
