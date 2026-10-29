/** Joins class names, dropping anything falsy. CSS-module lookups are typed as
 *  possibly undefined under noUncheckedIndexedAccess, so templates are unsafe. */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' ');
}
