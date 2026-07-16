import { format } from "date-fns";

const FORMAT_STR = "MMMM dd, yyyy";

/**
 * Returns date, formatted as a string.
 * @param date - Date.
 * @param formatStr - Format string.
 * @returns date, formatted as a string.
 */
export function formatDate(date: Date, formatStr = FORMAT_STR): string {
  return format(date, formatStr);
}
