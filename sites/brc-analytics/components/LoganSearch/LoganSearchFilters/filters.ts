/**
 * The filter a reader has narrowed a Logan search to, and its two encodings:
 * the f.* query parameters the backend takes (and the page URL carries, so a
 * filtered view is a link), and a DuckDB WHERE clause for the downloaded
 * parquet.
 *
 * The backend applies the filter over the job's whole match set. Nothing here
 * filters rows the browser holds, which are one page of a capped listing.
 */

export type LoganListField =
  | "assay_type"
  | "country"
  | "country_iso"
  | "instrument"
  | "library_layout"
  | "platform";

export interface LoganYearRange {
  max: number | null;
  min: number | null;
}

export interface LoganFilters {
  assay_type: string[];
  country: string[];
  // ISO 3166-1 alpha-3, from the map. The same dimension as `country` (raw
  // SRA strings, from the bars): the backend ORs the two.
  country_iso: string[];
  instrument: string[];
  library_layout: string[];
  platform: string[];
  score_min: number | null;
  year: LoganYearRange | null;
}

// Selects the runs with nothing recorded for a field. Mirrors NONE_VALUE in
// the backend's kmindex_filters.py.
export const NONE_VALUE = "__none__";

export const FILTER_PARAM_PREFIX = "f.";

export const LIST_FIELDS: readonly LoganListField[] = [
  "assay_type",
  "country",
  "country_iso",
  "instrument",
  "library_layout",
  "platform",
];

export const EMPTY_FILTERS: LoganFilters = {
  assay_type: [],
  country: [],
  country_iso: [],
  instrument: [],
  library_layout: [],
  platform: [],
  score_min: null,
  year: null,
};

// Cohort facet names (the mirror's column names) to the filter field each
// one toggles. release_year is a range and is handled on its own.
export const FACET_FIELDS: Record<string, LoganListField> = {
  assay_type: "assay_type",
  country: "country",
  instrument: "instrument",
  librarylayout: "library_layout",
  platform: "platform",
};

export const FIELD_LABELS: Record<LoganListField, string> = {
  assay_type: "Assay type",
  country: "Country",
  country_iso: "Country",
  instrument: "Instrument",
  library_layout: "Library layout",
  platform: "Platform",
};

/**
 * Whether a filter narrows nothing.
 * @param filters - Filter to check.
 * @returns True when no field is set.
 */
export function isEmptyFilters(filters: LoganFilters): boolean {
  return (
    LIST_FIELDS.every((field) => filters[field].length === 0) &&
    filters.score_min === null &&
    filters.year === null
  );
}

/**
 * Parse one f.year value: "2015..2020", "2015..", "..2020" or "2015".
 * @param value - Raw parameter value.
 * @returns The range, or null when the value is not one.
 */
function parseYear(value: string): LoganYearRange | null {
  const [low, high] = value.includes("..") ? value.split("..") : [value, value];
  const toYear = (part: string | undefined): number | null =>
    part && /^\d{4}$/.test(part) ? Number(part) : null;
  const range = { max: toYear(high), min: toYear(low) };
  if (range.min === null && range.max === null) return null;
  if (range.min !== null && range.max !== null && range.min > range.max)
    return null;
  return range;
}

/**
 * Read the f.* parameters out of a query string.
 *
 * Lenient where the backend is strict: a parameter this page cannot read is
 * dropped rather than raised, because the string came from a link someone
 * pasted and the page should still open.
 * @param search - A query string or URLSearchParams.
 * @returns The filter.
 */
export function parseFilters(search: string | URLSearchParams): LoganFilters {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  // Fresh lists, since the loop below pushes into them.
  const filters: LoganFilters = {
    assay_type: [],
    country: [],
    country_iso: [],
    instrument: [],
    library_layout: [],
    platform: [],
    score_min: null,
    year: null,
  };
  for (const [key, value] of params) {
    if (!key.startsWith(FILTER_PARAM_PREFIX) || !value) continue;
    const field = key.slice(FILTER_PARAM_PREFIX.length);
    if ((LIST_FIELDS as readonly string[]).includes(field)) {
      const list = filters[field as LoganListField];
      if (!list.includes(value)) list.push(value);
    } else if (field === "year") {
      filters.year = parseYear(value);
    } else if (field === "score") {
      const score = Number(value);
      filters.score_min =
        Number.isFinite(score) && score >= 0 && score <= 1 ? score : null;
    }
  }
  return filters;
}

/**
 * The filter as f.* parameter pairs, in a fixed order so equal filters
 * serialize equally.
 * @param filters - Filter to encode.
 * @returns [key, value] pairs.
 */
export function filterParams(filters: LoganFilters): [string, string][] {
  const pairs: [string, string][] = [];
  for (const field of LIST_FIELDS) {
    for (const value of [...filters[field]].sort()) {
      pairs.push([`${FILTER_PARAM_PREFIX}${field}`, value]);
    }
  }
  if (filters.score_min !== null)
    pairs.push([`${FILTER_PARAM_PREFIX}score`, String(filters.score_min)]);
  if (filters.year) {
    const { max, min } = filters.year;
    const value =
      min !== null && min === max ? String(min) : `${min ?? ""}..${max ?? ""}`;
    pairs.push([`${FILTER_PARAM_PREFIX}year`, value]);
  }
  return pairs;
}

/**
 * The filter as a query string, "" when it is empty. Stable, so it doubles as
 * the dependency key for requests that carry it.
 * @param filters - Filter to encode.
 * @returns e.g. "f.country=Kenya&f.platform=ILLUMINA".
 */
export function filterQuery(filters: LoganFilters): string {
  return new URLSearchParams(filterParams(filters)).toString();
}

/**
 * Add a value to a field, or take it away if it is already there.
 * @param filters - Current filter.
 * @param field - Field to change.
 * @param value - Value to toggle.
 * @returns A new filter.
 */
export function toggleValue(
  filters: LoganFilters,
  field: LoganListField,
  value: string
): LoganFilters {
  const current = filters[field];
  return {
    ...filters,
    [field]: current.includes(value)
      ? current.filter((one) => one !== value)
      : [...current, value],
  };
}

/**
 * Click a year on the timeline.
 *
 * The first click picks that year. A click on another year stretches the
 * range to include it, so two clicks make 2015 to 2020. Clicking the only
 * picked year again clears it, and clicking inside a range narrows it to that
 * one year, which is the quickest way back from a range that went too wide.
 * @param filters - Current filter.
 * @param year - Year clicked.
 * @returns A new filter.
 */
export function toggleYear(filters: LoganFilters, year: number): LoganFilters {
  const range = filters.year;
  if (!range || range.min === null || range.max === null) {
    return { ...filters, year: { max: year, min: year } };
  }
  if (range.min === year && range.max === year) {
    return { ...filters, year: null };
  }
  if (year >= range.min && year <= range.max) {
    return { ...filters, year: { max: year, min: year } };
  }
  return {
    ...filters,
    year: { max: Math.max(range.max, year), min: Math.min(range.min, year) },
  };
}

/**
 * Whether a year falls inside the picked range.
 * @param filters - Current filter.
 * @param year - Year to test.
 * @returns True when the range includes it.
 */
export function yearSelected(filters: LoganFilters, year: number): boolean {
  const range = filters.year;
  if (!range) return false;
  return (
    (range.min === null || year >= range.min) &&
    (range.max === null || year <= range.max)
  );
}

/**
 * A year range in words.
 * @param range - The range.
 * @returns e.g. "2015 to 2020", "2019", "from 2018".
 */
export function describeYears(range: LoganYearRange): string {
  const { max, min } = range;
  if (min !== null && max !== null)
    return min === max ? String(min) : `${min} to ${max}`;
  if (min !== null) return `from ${min}`;
  return `up to ${max}`;
}

/**
 * A SQL string literal.
 * @param value - Value to quote.
 * @returns The value in single quotes, embedded quotes doubled.
 */
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * One list field as a SQL condition over an export column.
 * @param column - Export column name.
 * @param values - Picked values, NONE_VALUE meaning IS NULL.
 * @returns The condition.
 */
function listCondition(column: string, values: string[]): string {
  const real = values.filter((value) => value !== NONE_VALUE);
  const parts: string[] = [];
  if (values.includes(NONE_VALUE)) parts.push(`${column} IS NULL`);
  if (real.length === 1) parts.push(`${column} = ${sqlString(real[0])}`);
  if (real.length > 1)
    parts.push(`${column} IN (${real.map(sqlString).join(", ")})`);
  return parts.length > 1 ? `(${parts.join(" OR ")})` : parts[0];
}

/**
 * The filter as a DuckDB WHERE clause over the downloaded parquet, whose
 * column names match the filter fields.
 *
 * Map picks are ISO codes, and the parquet carries SRA's raw country strings,
 * several of which can share one code. The server resolves that mapping; this
 * clause cannot, so those picks are named in a comment instead of guessed at.
 * @param filters - Filter to translate.
 * @param isoNames - Display names for ISO codes, for that comment.
 * @returns The clause, without the WHERE keyword.
 */
export function toDuckdbWhere(
  filters: LoganFilters,
  isoNames: Record<string, string> = {}
): string {
  const conditions: string[] = [];
  for (const field of LIST_FIELDS) {
    if (field === "country_iso" || filters[field].length === 0) continue;
    conditions.push(listCondition(field, filters[field]));
  }
  if (filters.year) {
    const { max, min } = filters.year;
    if (min !== null && max !== null)
      conditions.push(`year(release_date) BETWEEN ${min} AND ${max}`);
    else if (min !== null) conditions.push(`year(release_date) >= ${min}`);
    else if (max !== null) conditions.push(`year(release_date) <= ${max}`);
  }
  if (filters.score_min !== null)
    conditions.push(`score >= ${filters.score_min}`);
  const clause = conditions.length ? conditions.join("\nAND ") : "TRUE";
  if (filters.country_iso.length === 0) return clause;
  const picked = filters.country_iso
    .map((code) => isoNames[code] ?? code)
    .join(", ");
  return (
    `${clause}\n-- Countries picked on the map (${picked}) are matched by ISO ` +
    `code on the server, and can cover more than one raw country value, so ` +
    `they are not included above.`
  );
}
