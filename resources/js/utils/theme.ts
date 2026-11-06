// Colour themes of the interface: light (default), blue, dark.
// The theme is a user setting (saved with the other settings on the server);
// before login it is kept in the browser. The exercise "stage" (the canvas
// area) stays black in every theme: red-cyan glasses separate the two
// pictures properly only on black.
import { reactive } from 'vue';

export const THEMES = ['light', 'blue', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

/** English names, translated with t() where they are shown. */
export const THEME_LABELS: Record<Theme, string> = {
    light: 'Light',
    blue: 'Light blue',
    dark: 'Dark',
};

const STORAGE_KEY = 'lazyeye.theme';

export const themeState = reactive({ theme: 'light' as Theme });

export function isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Sets data-theme on <html>; charts redraw because they read themeState. */
export function applyTheme(theme: unknown): void {
    const value: Theme = isTheme(theme) ? theme : 'light';
    themeState.theme = value;
    document.documentElement.dataset.theme = value;

    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // storage blocked: the server setting still applies after login
    }
}

/** Theme kept in the browser (used before login). */
export function storedTheme(): Theme {
    try {
        const value = localStorage.getItem(STORAGE_KEY);

        return isTheme(value) ? value : 'light';
    } catch {
        return 'light';
    }
}

/** A colour from the theme's CSS variables, e.g. cssColor('--color-muted'). */
export function cssColor(name: string, fallback = '#888'): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
