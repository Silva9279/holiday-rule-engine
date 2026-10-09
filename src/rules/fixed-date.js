/**
 * FixedDate rule: a holiday that is always on the same calendar date with no
 * weekend adjustment (e.g. a fixed commemorative date). Provided for parity
 * with the other rules so consumers can build a uniform calendar.
 */

export class FixedDate {
  /**
   * @param {Object} opts
   * @param {number} opts.year
   * @param {number} opts.month - 1-indexed.
   * @param {number} opts.day
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
    if (target.getMonth() !== month0 || target.getDate() !== this._day) {
      throw new Error(`${this._month}/${this._day} does not exist in ${year}`);
    }
    return target;
  }
}
