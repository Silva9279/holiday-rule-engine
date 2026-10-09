# Holiday Rule Engine

A small, dependency-free library for computing the exact observed date of holidays from declarative rules like "fourth Thursday of November" and "nearest weekday to January 1".

## Usage

```js
import { Engine, NthWeekday, NearestWeekday, FixedDate } from 'holiday-rule-engine';

const engine = new Engine();
engine.register('thanksgiving', new NthWeekday({ year: 2024, month: 11, weekday: 'thursday', n: 4 }));
engine.register('new-year', new NearestWeekday({ year: 2025, month: 1, day: 1 }));
engine.register('independence', new FixedDate({ year: 2025, month: 7, day: 4 }));

const date = engine.resolve('thanksgiving', 2024);   // Date for 2024-11-28
const all = engine.resolveAll(2025);                // sorted array of { name, date }
```

The rule classes accept a `year` in their constructor and also a `yearOverride` argument to `resolve()`. Passing nothing to `resolve()` uses the constructor year; passing a year rebuilds the rule for that year without reconstruction, which is convenient when rendering a calendar range.

## Why it exists

Payroll, billing, and scheduling systems need to know whether a given calendar day is a holiday, and the "observed" date of a holiday frequently differs from its nominal date. This library exists to make that computation explicit and testable rather than scattered through business logic as hand-rolled `if` statements.

The trade-off: this library computes dates only. It does not know which jurisdictions observe which holidays, it does not know whether a holiday is a bank holiday or a retail holiday, and it does not know whether employees get the day off. Those are policy decisions that belong to the caller. Pushing them into the library would mean either shipping a static (and inevitably incomplete) list or depending on a data source, both of which break the zero-dependency constraint and the determinism constraint.

## The awkward edge: the Sunday tie

The `NearestWeekday` rule handles the case where a nominal holiday falls on a weekend by moving to the adjacent Friday (for Saturday) or Monday (for Sunday). The genuinely ambiguous case is when the target is a Sunday that is exactly equidistant from the preceding Friday and the following Monday. We resolve this by moving **forward to Monday**, matching the US federal-observance convention for holidays like New Year's Day. If you need the opposite convention (back to Friday), do not use this rule — write your own.

A second edge worth flagging: the `NthWeekday` rule throws when you ask for a fifth occurrence in a month that has only four. Returning the first occurrence of the next month would be a silent wrong-date bug, so we fail loudly.
