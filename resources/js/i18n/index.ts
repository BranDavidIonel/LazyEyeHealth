// Two languages: Romanian (default) and English. Same rule as Laravel's __():
// the text in the code is English and is also the translation key.
//
//   t('Eye break')                       → "Pauză pentru ochi" (ro) / "Eye break" (en)
//   t('You worked :min minutes.', { min: 20 })
//
// Romanian translations live in:
//   resources/js/i18n/ro/*.ts   one file per area (one per exercise / page group),
//                               default export { 'English text': 'Romanian text' }
//   lang/ro.json                texts that come from the server (catalog, flash
//                               messages...); also loaded here
// A text without a Romanian translation is shown in English.
import type { App } from 'vue';
import { reactive } from 'vue';
import serverRo from '../../../lang/ro.json';

export type Locale = 'ro' | 'en';
export type Replacements = Record<string, string | number>;

const modules = import.meta.glob<{ default: Record<string, string> }>(
    './ro/*.ts',
    { eager: true },
);

const romanian: Record<string, string> = { ...serverRo };

for (const module of Object.values(modules)) {
    Object.assign(romanian, module.default);
}

const state = reactive({ locale: 'ro' as Locale });

/** Called by the layouts with the language sent by the server. */
export function setLocale(locale: string): void {
    state.locale = locale === 'en' ? 'en' : 'ro';
    document.documentElement.lang = state.locale;
}

export function getLocale(): Locale {
    return state.locale;
}

/** Intl locale for numbers and dates. */
export function intlLocale(): string {
    return state.locale === 'en' ? 'en-GB' : 'ro-RO';
}

/** Translates an English text to the current language and fills the :placeholders. */
export function t(text: string, replacements: Replacements = {}): string {
    let out = state.locale === 'ro' ? (romanian[text] ?? text) : text;

    // Longest names first, so ":min" never eats the start of ":minutes".
    const names = Object.keys(replacements).sort((a, b) => b.length - a.length);

    for (const name of names) {
        out = out.replaceAll(`:${name}`, String(replacements[name]));
    }

    return out;
}

/** Adds `$t()` to every component (templates and `this.$t()`). */
export const i18n = {
    install(app: App): void {
        app.config.globalProperties.$t = (
            text: string,
            replacements?: Replacements,
        ): string => t(text, replacements);
    },
};

declare module 'vue' {
    interface ComponentCustomProperties {
        /** English text → current language. See resources/js/i18n/index.ts. */
        $t: (text: string, replacements?: Replacements) => string;
    }
}
