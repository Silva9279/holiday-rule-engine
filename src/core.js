/**
 * HolidayRule and Engine.
 *
 * The engine is a thin registry: consumers register rules by string key
 * (e.g. 'thanksgiving'), then resolve them by key plus a year. Rules are
 * responsible for all date arithmetic; the engine only routes. This keeps
 * the rule set extensible without modifying the engine itself, which matters
 * because 'observed holiday' rules are jurisdiction-specific and never
 * truly finished.
 */

/**
 * @typedef {Object} HolidayRule
 * @property {(year: number) => Date} resolve - Return the observed date for the given year.
 *   Dates are constructed with the local-Datetime constructor and returned
 *   verbatim (not normalized to UTC), because a holiday is a calendar date,
 *   not an instant. Callers comparing two results should compare the numeric
 *   `.getTime()` value or the `.getFullYear()/getMonth()/getDate()` fields,
 *   never referential equality.
 */

/**
 * @typedef {Object} ResolvedHoliday
 * @property {string} name - The key passed to register().
 * @property {Date} date - The observed date.
 */

export class Engine {
  constructor() {
    /** @type {Map<string, HolidayRule>} */
    this._rules = new Map();
  }

  /**
   * Register a rule under a string key.
   *
   * The engine treats `name` as an opaque identifier. Overwriting an
   * existing key is allowed so callers can override built-in rules without
   * modifying library state.
   *
   * @param {string} name
   * @param {HolidayRule} rule
   * @returns {this}
   */
  register(name, rule) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('name must be a non-empty string');
    }
    if (rule === null || typeof rule !== 'object' || typeof rule.resolve !== 'function') {
      throw new TypeError('rule must have a resolve(year) function');
    }
    this._rules.set(name, rule);
    return this;
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._rules.has(name);
  }

  /**
   * Resolve a single holiday. Throws if the name is unknown — 'undefined'
   * is a silent failure mode and silent failures in date code tend to surface
   * much later as wrong payroll runs, so we fail loudly.
   *
   * @param {string} name
   * @param {number} year
   * @returns {Date}
   */
  resolve(name, year) {
    const rule = this._rules.get(name);
    if (!rule) {
      throw new Error(`No holiday registered as '${name}'`);
    }
    if (!Number.isInteger(year)) {
      throw new TypeError('year must be an integer');
    }
    const date = rule.resolve(year);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error(`Rule '${name}' returned an invalid date`);
    }
    return date;
  }

  /**
   * Resolve all registered holidays for a year, sorted ascending by date.
   * Sorting here is a deliberate convenience: most consumers want a
   * calendar view, and sorting at the call site means every consumer
   * re-implements the same comparator.
   *
   * @param {number} year
   * @returns {ResolvedHoliday[]}
   */
  resolveAll(year) {
    if (!Number.isInteger(year)) {
      throw new TypeError('year must be an integer');
    }
    const out = [];
    for (const [name, rule] of this._rules) {
      const date = rule.resolve(year);
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error(`Rule '${name}' returned an invalid date`);
      }
      out.push({ name, date });
    }
    out.sort((a, b) => a.date.getTime() - b.date.getTime());
    return out;
  }
}
