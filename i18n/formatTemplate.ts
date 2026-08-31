/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Format Template XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Substitutes `{placeholder}`-style tokens in a dictionary string with the
 * given values — e.g. `formatTemplate(dict.videos.views, {count: "12.5K"})` →
 * `"12.5K views"`. Deliberately not a pluralization system (no ICU
 * MessageFormat/a new library) — every template this project has is already
 * "always plural, count-agnostic" in English (`formatCount(...) + " views"`
 * regardless of whether the count is 1), and each locale's translated
 * template preserves that same behavior rather than introducing a
 * singular/plural distinction this codebase never had.
 *
 * Kept in its own module, separate from `i18n/dictionaries.ts` — that file
 * carries `import "server-only"`, which poisons the *whole* module for any
 * Client Component that imports from it, even for an unrelated named export.
 * `formatTemplate` genuinely needs to be callable from Client Components
 * (`VideoCard.tsx` et al.) that already received a translated template string
 * as a prop and just need to fill in a placeholder — it does nothing
 * server-only itself, so it doesn't belong behind that guard.
 * @param template A dictionary string containing `{key}` placeholders.
 * @param values The value to substitute for each placeholder, keyed by name.
 */
export const formatTemplate = (template: string, values: Record<string, string>): string =>
    Object.entries(values).reduce(
        (result, [key, value]) => result.replace(`{${key}}`, value),
        template,
    );
