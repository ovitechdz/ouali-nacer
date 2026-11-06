/**
 * Time is always injected. Domain code must never call `Date.now()` directly,
 * so age, staleness and audit timestamps stay testable and reproducible.
 */
export interface Clock {
  now(): Date;
}
