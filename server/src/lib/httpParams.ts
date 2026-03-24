/** Normalize Express route params (typed as `string | string[]` in recent @types/express). */
export function pathParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
