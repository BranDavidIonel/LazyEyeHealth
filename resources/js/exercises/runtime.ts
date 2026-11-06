// Runs an exercise inside its Vue page and cleans everything up when you
// leave the page (timers, animation frames, key listeners, pop-ups, time tracking).
//
// An exercise module looks like this:
//
//   import Amb from '@/amb';
//   import type { Runtime } from '@/exercises/runtime';
//
//   export default function start(rt: Runtime): void {
//       const canvas = rt.$<HTMLCanvasElement>('cv');      // element with id="cv" in the page
//       rt.on(document, 'keydown', (e) => { ... });         // removed automatically
//       rt.timeout(next, 400);                              // cancelled automatically
//       Amb.startTracking('vernier', { onPause: pause });   // stopped automatically
//   }
import Amb from '@/amb';

export type Runtime = {
    /** The page element that holds the exercise markup. */
    root: HTMLElement;
    /** Element by id inside the exercise (throws if it is missing). */
    $: <T extends HTMLElement = HTMLElement>(id: string) => T;
    /** addEventListener that is removed when the page closes. */
    on: <E extends Event = Event>(
        target: EventTarget,
        type: string,
        handler: (event: E) => void,
        options?: AddEventListenerOptions | boolean,
    ) => void;
    timeout: (fn: () => void, ms: number) => number;
    interval: (fn: () => void, ms: number) => number;
    clearTimeout: (id: number) => void;
    clearInterval: (id: number) => void;
    /** requestAnimationFrame that is cancelled when the page closes. */
    raf: (fn: FrameRequestCallback) => number;
    cancelRaf: (id: number) => void;
    /** Extra clean-up to run when the page closes. */
    onCleanup: (fn: () => void) => void;
    /** true after the page was closed (stop loops that check it). */
    readonly disposed: boolean;
};

export type ExerciseStart = (rt: Runtime) => void;

export function mountExercise(
    root: HTMLElement,
    start: ExerciseStart,
): () => void {
    const timeouts = new Set<number>();
    const intervals = new Set<number>();
    const frames = new Set<number>();
    const cleanups: (() => void)[] = [];
    let disposed = false;

    const rt: Runtime = {
        root,
        $: <T extends HTMLElement = HTMLElement>(id: string): T => {
            const el = root.querySelector<T>(`#${CSS.escape(id)}`);

            if (!el) {
                throw new Error(`Elementul #${id} lipsește din pagina exercițiului.`);
            }

            return el;
        },
        on: (target, type, handler, options) => {
            const listener = handler as EventListener;
            target.addEventListener(type, listener, options);
            cleanups.push(() =>
                target.removeEventListener(type, listener, options),
            );
        },
        timeout: (fn, ms) => {
            const id = window.setTimeout(() => {
                timeouts.delete(id);
                fn();
            }, ms);
            timeouts.add(id);

            return id;
        },
        interval: (fn, ms) => {
            const id = window.setInterval(fn, ms);
            intervals.add(id);

            return id;
        },
        clearTimeout: (id) => {
            window.clearTimeout(id);
            timeouts.delete(id);
        },
        clearInterval: (id) => {
            window.clearInterval(id);
            intervals.delete(id);
        },
        raf: (fn) => {
            const id = window.requestAnimationFrame((t) => {
                frames.delete(id);

                if (!disposed) {
                    fn(t);
                }
            });
            frames.add(id);

            return id;
        },
        cancelRaf: (id) => {
            window.cancelAnimationFrame(id);
            frames.delete(id);
        },
        onCleanup: (fn) => {
            cleanups.push(fn);
        },
        get disposed() {
            return disposed;
        },
    };

    // Links to app pages inside the exercise ("/calibrare") open without reloading.
    rt.on<MouseEvent>(root, 'click', (event) => {
        const link = (event.target as Element).closest('a');
        const href = link?.getAttribute('href');

        if (link && href?.startsWith('/') && !link.target) {
            event.preventDefault();
            Amb.go(href);
        }
    });

    start(rt);

    return () => {
        disposed = true;
        timeouts.forEach((id) => window.clearTimeout(id));
        intervals.forEach((id) => window.clearInterval(id));
        frames.forEach((id) => window.cancelAnimationFrame(id));
        cleanups.reverse().forEach((fn) => fn());
        Amb.stopTracking();
        Amb.closeOverlays();
        void Amb.flushSettings();
    };
}
