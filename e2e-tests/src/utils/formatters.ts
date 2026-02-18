import dayjs from "dayjs";

function getOrdinal(n: number) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
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
  const d = dayjs(date);
  const day = d.date();
  const ordinal = getOrdinal(day);

  return `${day}${ordinal} ${d.format("MMMM YYYY")}`;
}
