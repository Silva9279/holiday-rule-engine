/**
 * NearestWeekday rule.
 *
 * Computes the weekday nearest to a given month/day. If the target falls on
 * a weekend, the observed holiday moves to the adjacent Friday or Monday.
 *
 * Choice made for the ambiguous 'tie' case: if the target is exactly
 * equidistant from Friday and Monday (i.e. it falls on a Sunday), we move
 * FORWARD to Monday. This matches the US federal-observance convention used
 * for New Year's Day and similar holidays, where Sunday holidays are observed
 * the following Monday. This is the only such tie rule we support, and it is
 * stated plainly in the README.
 */

export class NearestWeekday {
  /**
   * @param {Object} opts
   * @param {number} opts.year
   * @param {number} opts.month - 1-indexed.
   * @param {number} opts.day   - Day of month.
   */
  constructor({ year, month, day }) {
    if (!Number.isInteger(year)) throw new TypeError('year must be an integer');
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new TypeError('month must be an integer 1-12');
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new TypeError('day must be an integer 1-31');
    }
    this._year = year;
    this._month = month;
    this._day = day;
  }

  /**
   * @param {number} [yearOverride]
   * @returns {Date}
   */
  resolve(yearOverride) {
    const year = yearOverride === undefined ? this._year : yearOverride;
    if (!Number.isInteger(year)) throw new TypeError('year must be an integer');
    const month0 = this._month - 1;
    const target = new Date(year, month0, this._day);
    // Validate the day actually exists in this month — e.g. 31 February
    // rolls over to 3 March, which is not what 'nearest to Feb 31' should mean.
    if (target.getMonth() !== month0 || target.getDate() !== this._day) {
      throw new Error(`${this._month}/${this._day} does not exist in ${year}`);
    }

    const dow = target.getDay();
    // 0 Sun, 6 Sat.
    if (dow === 0) {
      // Sunday tie: move forward to Monday.
      return new Date(year, month0, this._day + 1);
    }
    if (dow === 6) {
      return new Date(year, month0, this._day - 1);
    }
    return target;
  }
}
