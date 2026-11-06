// Pop-up window used by the exercises (intro, pause, results).
// Plain DOM on purpose: the game code builds the HTML as text, like before.
import { router } from '@inertiajs/vue3';

export type OverlayButton = {
    label: string;
    primary?: boolean;
    id?: string;
    disabled?: boolean;
    /** returning false keeps the window open */
    onClick?: () => boolean | void;
};

const open = new Set<HTMLElement>();

/** Opens a window with the given HTML and buttons. Links to app pages ("/calibrare") open without reloading. */
export function overlay(
    html: string,
    buttons: OverlayButton[] = [],
): { el: HTMLElement; close: () => void } {
    const wrap = document.createElement('div');
    wrap.className = 'amb amb-overlay';
    const box = document.createElement('div');
    box.className = 'amb-modal';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = html;

    const bar = document.createElement('div');
    bar.className = 'amb-modal-actions';
    let primary: HTMLButtonElement | null = null;

    const close = (): void => {
        wrap.remove();
        open.delete(wrap);
    };

    for (const b of buttons) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `btn${b.primary ? ' primary' : ''}`;
        el.textContent = b.label;

        if (b.id) {
            el.id = b.id;
        }

        el.disabled = !!b.disabled;
        el.onclick = () => {
            if (b.onClick && b.onClick() === false) {
                return;
            }

            close();
        };

        if (b.primary) {
            primary = el;
        }

        bar.appendChild(el);
    }

    if (bar.children.length) {
        box.appendChild(bar);
    }

    box.addEventListener('click', (event) => {
        const link = (event.target as Element).closest('a');
        const href = link?.getAttribute('href');

        if (link && href?.startsWith('/') && !link.target) {
            event.preventDefault();
            closeOverlays();
            router.visit(href);
        }
    });

    wrap.appendChild(box);
    document.body.appendChild(wrap);
    open.add(wrap);

    const focus = primary as HTMLButtonElement | null;

    if (focus && !focus.disabled) {
        setTimeout(() => focus.focus(), 30);
    }

    return { el: box, close };
}

export function modalOpen(): boolean {
    return open.size > 0;
}

/** Closes every pop-up (when leaving the exercise page). */
export function closeOverlays(): void {
    open.forEach((el) => el.remove());
    open.clear();
}
