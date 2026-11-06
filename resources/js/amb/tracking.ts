// Practice time + break reminder. While the game says it is active
// (setActive(true)), every second is counted; every 15 s the seconds are sent
// to the server (POST /api/practice), and once more when the page closes.
import { reactive } from 'vue';
import { sendOrQueue } from '@/lib/http';
import { overlay } from './overlay';
import { settings } from './settings';
import { beep } from './sound';

export type TrackingHooks = {
    /** called when the page is hidden or a break starts: pause the game */
    onPause?: () => void;
    /** called after the break window is closed */
    onResume?: () => void;
};

export const tracker = reactive({
    game: '',
    active: false,
    /** seconds counted but not sent yet */
    pending: 0,
    /** seconds sent from this page */
    sent: 0,
    /** today's seconds on the server when the page was opened */
    todayBase: 0,
    sinceBreak: 0,
    breakOpen: false,
});

let hooks: TrackingHooks = {};
let timer: ReturnType<typeof setInterval> | null = null;

const onPageHide = (): void => flush(true);
const onVisibility = (): void => {
    if (!document.hidden) {
        return;
    }

    flush();

    if (tracker.active) {
        hooks.onPause?.();
    }
};

/** Called by the layouts with the server's "todaySeconds" on every page. */
export function setTodayBase(seconds: number): void {
    tracker.todayBase = seconds;
    tracker.sent = 0;
}

export function todaySeconds(): number {
    return tracker.todayBase + tracker.sent + tracker.pending;
}

/** Starts counting time for an exercise. Returns the function that stops it. */
export function startTracking(
    game: string,
    trackingHooks: TrackingHooks = {},
): () => void {
    stopTracking();
    hooks = trackingHooks;
    tracker.game = game;
    tracker.active = false;
    tracker.pending = 0;
    tracker.sinceBreak = 0;
    tracker.breakOpen = false;
    timer = setInterval(tick, 1000);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);

    return stopTracking;
}

export function stopTracking(): void {
    flush();

    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibility);
    tracker.game = '';
    tracker.active = false;
    hooks = {};
}

/** Games call setActive(true) while the player is actually playing. */
export function setActive(on: boolean): void {
    tracker.active = !!on;
}

function tick(): void {
    if (
        !tracker.game ||
        !tracker.active ||
        document.hidden ||
        tracker.breakOpen
    ) {
        return;
    }

    tracker.pending++;
    tracker.sinceBreak++;

    if (tracker.pending >= 15) {
        flush();
    }

    const every = settings().breakEveryMin;

    if (every > 0 && tracker.sinceBreak >= every * 60) {
        showBreak();
    }
}

/** Sends the counted seconds now. */
export function flush(keepalive = false): void {
    if (!tracker.game || tracker.pending <= 0) {
        return;
    }

    const seconds = tracker.pending;
    tracker.pending = 0;
    tracker.sent += seconds;

    void sendOrQueue<{ today_seconds: number }>(
        'POST',
        '/api/practice',
        { exercise: tracker.game, seconds },
        { keepalive },
    ).then((response) => {
        if (response && tracker.pending < 15) {
            tracker.todayBase = response.today_seconds;
            tracker.sent = 0;
        }
    });
}

function showBreak(): void {
    tracker.breakOpen = true;
    tracker.sinceBreak = 0;
    flush();
    hooks.onPause?.();

    let left = 20;
    const minutes = settings().breakEveryMin;
    const done = (): void => {
        clearInterval(countdown);
        tracker.breakOpen = false;
        hooks.onResume?.();
    };

    const modal = overlay(
        '<h2>Pauză pentru ochi</h2>' +
            `<p>Ai lucrat ${minutes} de minute. Scoate ochelarii sau ocluzorul și privește 20 de secunde ` +
            'la ceva aflat la cel puțin 6 metri (pe geam sau în capătul camerei). Clipește des.</p>' +
            '<div class="amb-big" id="amb-break-count">20</div>',
        [
            { label: 'Sari peste', onClick: done },
            {
                label: 'Am făcut pauza',
                primary: true,
                id: 'amb-break-go',
                disabled: true,
                onClick: done,
            },
        ],
    );

    const countdown = setInterval(() => {
        left--;
        const counter = modal.el.querySelector('#amb-break-count');

        if (counter) {
            counter.textContent = String(Math.max(0, left));
        }

        if (left <= 0) {
            clearInterval(countdown);
            const go = modal.el.querySelector<HTMLButtonElement>('#amb-break-go');

            if (go) {
                go.disabled = false;
                go.focus();
            }

            beep('ok');
        }
    }, 1000);
}
