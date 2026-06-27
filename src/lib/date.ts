/**
 * A calendar date as `YYYY-MM-DD` in the browser's **local** timezone.
 *
 * Use this instead of `new Date().toISOString().split("T")[0]` for day-level
 * bucketing/comparison. `toISOString()` is UTC, so near midnight it returns the
 * wrong calendar day for users west/east of UTC — e.g. at 22:00 in UTC-3 it
 * already reports tomorrow, which made "today" stop matching the backend's
 * timezone-aware `localDate` (meals fell into "yesterday", macros read 0g).
 */
export function localDateStr(d: Date = new Date()): string {
   const year = d.getFullYear()
   const month = String(d.getMonth() + 1).padStart(2, "0")
   const day = String(d.getDate()).padStart(2, "0")
   return `${year}-${month}-${day}`
}
