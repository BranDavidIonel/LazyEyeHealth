import { createInertiaApp } from '@inertiajs/vue3';
import { i18n, setLocale } from '@/i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import { flushQueue } from '@/lib/http';

const appName = import.meta.env.VITE_APP_NAME || 'LazyEyeHealth';

/**
 * Pages with their own full-screen frame (no menu bar): the login, the
 * exercises (ExerciseShell) and the vision tests (TestShell).
 */
function hasOwnFrame(name: string): boolean {
    return (
        name.startsWith('auth/') ||
        (name.startsWith('exercises/') && name !== 'exercises/Index') ||
        (name.startsWith('vision/') && name !== 'vision/Index')
    );
}

void createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    layout: (name) => (hasOwnFrame(name) ? null : AppLayout),
    withApp: (app, { page }) => {
        // Language before the first render, so the page never flashes in the wrong one.
        setLocale(String(page.props.locale ?? 'ro'));
        app.use(i18n);
        app.directive('focus', {
            mounted: (el: HTMLElement, shouldFocus) => {
                if (shouldFocus.value !== false) {
                    el.focus();
                }
            },
        });
    },
    progress: {
        color: '#4fc3f7',
    },
});

// Practice time or results that could not be sent last time (no connection): send them now.
void flushQueue();
