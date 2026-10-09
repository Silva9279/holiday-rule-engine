/**
 * NthWeekday rule: 'nth <weekday> of <month>'.
 *
 * Examples: 'fourth Thursday of November', 'first Monday of September',
 * 'last Monday of May'. The ordinal may be 1-5 or -1 (last). -2, -3 etc. are
 * also supported for completeness but rarely needed.
 */

const DAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Normalise a weekday name to its 0-6 index. Case-insensitive; accepts
 * full English names. Abbreviations are intentionally rejected because
 * 'Mon' vs 'Monday' is the kind of inconsistency that produces silent
 * wrong dates — better to make the caller be explicit.
 *
 * @param {string} name
 * @returns {number}
 */
function weekdayIndex(name) {
  const key = String(name).toLowerCase();
  if (Object.prototype.hasOwnProperty.call(DAYS, key)) {
    return DAYS[key];
  }
  throw new Error(`Unknown weekday: ${name}`);
}

export class NthWeekday {
  /**
   * @param {Object} opts
   * @param {number} opts.year   - Base year. Usually the same year being resolved,
   *   but kept explicit so the rule object is self-describing and not
   *   coupled to the engine's call site.
   * @param {number} opts.month   - 1-indexed month (1=January).
   * @param {string} opts.weekday - Full weekday name, case-insensitive.
   * @param {number} opts.n       - Ordinal: 1 for first, 2 for second, ... 5 for fifth
   *   (may yield no match for months that don't have five). -1 for last, -2 for
   *   second-to-last, etc.
   */
  constructor({ year, month, weekday, n }) {
    if (!Number.isInteger(year)) throw new TypeError('year must be an integer');
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new TypeError('month must be an integer 1-12');
    }
    if (!Number.isInteger(n) || n === 0 || n < -5 || n > 5) {
      throw new TypeError('n must be a non-zero integer in [-5, 5] excluding 0');
    }
    this._year = year;
    this._month = month;
    this._weekday = weekdayIndex(weekday);
    this._n = n;
  }

  /**
   * @param {number} [yearOverride]
   * @returns {Date}
   */
  resolve(yearOverride) {
    // The base year in the constructor and the year passed to resolve() are
    // allowed to differ. This lets the same rule object be reused across
    // years without reconstruction, which is how calendars render ranges.
    const year = yearOverride === undefined ? this._year : yearOverride;
    if (!Number.isInteger(year)) throw new TypeError('year must be an integer');

    const month0 = this._month - 1;

    if (this._n > 0) {
      const firstOfMonth = new Date(year, month0, 1);
      const offset = (this._weekday - firstOfMonth.getDay() + 7) % 7;
      const day = 1 + offset + (this._n - 1) * 7;
      const candidate = new Date(year, month0, day);
      // JS overflows: Date(2026, 1, 32) becomes 1 March. Use that to detect
      // an impossible fifth-occurrence request rather than returning a
      // date in the following month.
      if (candidate.getMonth() !== month0) {
        throw new Error(
          `Month ${this._month} of ${year} has no ${ordinal(this._n)} ${weekdayName(this._weekday)}`
        );
      }
      return candidate;
    }

    // Negative n: count from the end of the month.
    const lastOfMonth = new Date(year, month0 + 1, 0); // day 0 of next month = last day of this month
    const offset = (lastOfMonth.getDay() - this._weekday + 7) % 7;
    const day = lastOfMonth.getDate() - offset - (-this._n - 1) * 7;
    const candidate = new Date(year, month0, day);
    if (candidate.getMonth() !== month0) {
      throw new Error(
        `Month ${this._month} of ${year} has no ${ordinal(this._n)} ${weekdayName(this._weekday)}`
      );
    }
    return candidate;
  }
}

function ordinal(n) {
  const abs = Math.abs(n);
  if (abs === 1) return n < 0 ? 'last' : 'first';
  if (abs === 2) return n < 0 ? 'second-to-last' : 'second';
  if (abs === 3) return n < 0 ? 'third-to-last' : 'third';
  if (abs === 4) return n < 0 ? 'fourth-to-last' : 'fourth';
  return n < 0 ? `${abs}th-to-last` : `${abs}th`;
}

function weekdayName(i) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i];
}
