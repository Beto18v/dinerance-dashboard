const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/Bogota",
  "America/New_York",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "Europe/Madrid",
];

type QuickRange = "today" | "last7" | "thisMonth";

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: string) => string[];
};

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface DateTimeParts extends DateParts {
  hour: number;
  minute: number;
  second: number;
}

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function isValidTimeZone(value: string) {
  if (!value.trim()) return false;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value?: string | null) {
  if (value && isValidTimeZone(value)) return value;
  return "UTC";
}

export function getSupportedTimeZones() {
  const intlApi = Intl as IntlWithSupportedValues;
  const supportedValues = intlApi.supportedValuesOf?.("timeZone");

  if (supportedValues?.length) {
    return supportedValues;
  }

  return FALLBACK_TIME_ZONES;
}

export function formatDateTimeLocalInTimeZone(
  value: string,
  timeZone: string,
) {
  const parts = getDateTimeParts(new Date(value), timeZone);

  return [
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    `${pad(parts.hour)}:${pad(parts.minute)}`,
  ].join("T");
}

export function dateTimeLocalToUtcIso(value: string, timeZone: string) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return buildUtcDateFromTimeZoneParts(
    {
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
    },
    timeZone,
  ).toISOString();
}

export function dateInputBoundaryToUtcIso(
  value: string,
  boundary: "start" | "end",
  timeZone: string,
) {
  const [year, month, day] = value.split("-").map(Number);

  return buildUtcDateFromTimeZoneParts(
    {
      year,
      month,
      day,
      hour: boundary === "start" ? 0 : 23,
      minute: boundary === "start" ? 0 : 59,
      second: boundary === "start" ? 0 : 59,
    },
    timeZone,
  ).toISOString();
}

export function getCurrentMonthValue(timeZone: string) {
  return getTodayDateInputValue(timeZone).slice(0, 7);
}

export function getQuickRangeDates(range: QuickRange, timeZone: string) {
  const today = getCurrentLocalDate(timeZone);
  const endDate = createCalendarDate(today);
  const startDate = createCalendarDate(today);

  if (range === "today") {
    return {
      startDate: formatCalendarDate(startDate),
      endDate: formatCalendarDate(endDate),
    };
  }

  if (range === "last7") {
    startDate.setUTCDate(startDate.getUTCDate() - 6);
    return {
      startDate: formatCalendarDate(startDate),
      endDate: formatCalendarDate(endDate),
    };
  }

  startDate.setUTCDate(1);
  return {
    startDate: formatCalendarDate(startDate),
    endDate: formatCalendarDate(endDate),
  };
}

export function getTodayDateInputValue(timeZone: string) {
  return formatCalendarDate(createCalendarDate(getCurrentLocalDate(timeZone)));
}

function createCalendarDate(parts: DateParts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function formatCalendarDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getCurrentLocalDate(timeZone: string) {
  return getDateParts(new Date(), timeZone);
}

function getDateParts(value: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(value);

  return {
    year: Number(getPart(parts, "year")),
    month: Number(getPart(parts, "month")),
    day: Number(getPart(parts, "day")),
  };
}

function getDateTimeParts(value: Date, timeZone: string): DateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(value);

  return {
    year: Number(getPart(parts, "year")),
    month: Number(getPart(parts, "month")),
    day: Number(getPart(parts, "day")),
    hour: Number(getPart(parts, "hour")),
    minute: Number(getPart(parts, "minute")),
    second: Number(getPart(parts, "second")),
  };
}

function buildUtcDateFromTimeZoneParts(
  parts: DateTimeParts,
  timeZone: string,
) {
  const resolvedTimeZone = resolveTimeZone(timeZone);
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  let offsetMinutes = getTimeZoneOffsetMinutes(
    resolvedTimeZone,
    new Date(utcGuess),
  );
  let adjustedUtcMs = utcGuess - offsetMinutes * 60_000;

  const correctedOffsetMinutes = getTimeZoneOffsetMinutes(
    resolvedTimeZone,
    new Date(adjustedUtcMs),
  );
  if (correctedOffsetMinutes !== offsetMinutes) {
    offsetMinutes = correctedOffsetMinutes;
    adjustedUtcMs = utcGuess - offsetMinutes * 60_000;
  }

  return new Date(adjustedUtcMs);
}

function getTimeZoneOffsetMinutes(timeZone: string, value: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(value);
  const offsetLabel = getPart(parts, "timeZoneName");

  return parseOffsetMinutes(offsetLabel);
}

function parseOffsetMinutes(value: string) {
  if (!value || value === "GMT" || value === "UTC") return 0;

  const match = value.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;

  const [, sign, hours, minutes = "00"] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes);

  return sign === "-" ? -totalMinutes : totalMinutes;
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: string,
) {
  return parts.find((part) => part.type === type)?.value ?? "0";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
