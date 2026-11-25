/**
 * Pure address-suggestion core. Given a starting candidate and a "taken" predicate, step (by
 * sibling-increment) until a free address is found. The repository supplies the taken set from the
 * anchor's existing children, so this stays pure and unit-tested. See design/slice-5-suggester.md.
 */
export function firstFree(
  start: string,
  step: (addr: string) => string,
  taken: (addr: string) => boolean,
): string {
  let addr = start;
  while (taken(addr)) {
    addr = step(addr);
  }
  return addr;
}
