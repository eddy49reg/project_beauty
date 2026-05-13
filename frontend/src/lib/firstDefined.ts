export function firstDefined<T>(
  ...values: (T | null | undefined)[]
): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}
