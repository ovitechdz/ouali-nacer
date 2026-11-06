/**
 * Identifiers are generated behind a port so tests can use deterministic ids.
 * The production adapter emits ULIDs for lexicographic time ordering.
 */
export interface IdGenerator {
  next(): string;
}
