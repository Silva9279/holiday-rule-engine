/**
 * Public API for the Holiday Rule Engine.
 *
 * All rule constructors and the engine that resolves them are re-exported
 * from here so consumers can import from a single entry point:
 *
 *   import { Engine, NthWeekday, NearestWeekday, FixedDate } from 'holiday-rule-engine';
 */

export { Engine } from './core.js';
export { NthWeekday } from './rules/nth-weekday.js';
export { NearestWeekday } from './rules/nearest-weekday.js';
export { FixedDate } from './rules/fixed-date.js';
