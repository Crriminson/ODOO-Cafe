/**
 * Shared formatting utilities.
 * All values displayed to the user go through these — never format inline.
 */

// ─── Currency ────────────────────────────────────────────────────────────────

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style:                 'currency',
  currency:              'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a number or numeric string as Indian Rupees.
 * e.g. formatCurrency("1250.50") → "₹1,250.50"
 * e.g. formatCurrency(0)         → "₹0.00"
 *
 * @param {number | string | null | undefined} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  const n = parseFloat(value ?? 0);
  if (isNaN(n)) return '₹0.00';
  return CURRENCY_FORMATTER.format(n);
};

// ─── Date/Time ───────────────────────────────────────────────────────────────

const KOLKATA_TZ = 'Asia/Kolkata';

/**
 * Format a UTC ISO 8601 timestamp as a human-readable date+time in Asia/Kolkata.
 * e.g. "2024-06-13T10:30:00Z" → "13 Jun 2024, 4:00 PM"
 *
 * @param {string | null | undefined} isoString
 * @returns {string}
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone:    KOLKATA_TZ,
      day:         'numeric',
      month:       'short',
      year:        'numeric',
      hour:        'numeric',
      minute:      '2-digit',
      hour12:      true,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

/**
 * Format a UTC ISO 8601 timestamp as a date-only string in Asia/Kolkata.
 * e.g. "2024-06-13T10:30:00Z" → "13 Jun 2024"
 *
 * @param {string | null | undefined} isoString
 * @returns {string}
 */
export const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: KOLKATA_TZ,
      day:      'numeric',
      month:    'short',
      year:     'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

/**
 * Format a UTC ISO 8601 timestamp as time-only in Asia/Kolkata.
 * e.g. "2024-06-13T10:30:00Z" → "4:00 PM"
 *
 * @param {string | null | undefined} isoString
 * @returns {string}
 */
export const formatTime = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: KOLKATA_TZ,
      hour:     'numeric',
      minute:   '2-digit',
      hour12:   true,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

/**
 * Get today's date range in UTC ISO 8601, computed from Asia/Kolkata boundaries.
 * Use this for report period filter: "Today".
 *
 * @returns {{ from: string, to: string }}
 */
export const getTodayRangeUTC = () => {
  const now      = new Date();
  const kolkata  = new Intl.DateTimeFormat('en-CA', {
    timeZone: KOLKATA_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);  // e.g. "2024-06-13"

  const startLocal = new Date(`${kolkata}T00:00:00+05:30`);
  const endLocal   = new Date(`${kolkata}T23:59:59.999+05:30`);

  return {
    from: startLocal.toISOString(),
    to:   endLocal.toISOString(),
  };
};
