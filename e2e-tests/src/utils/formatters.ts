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
