<template>
    <div class="rounded-lg border border-line bg-panel-2 p-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div class="lh-barrel-sheet mx-auto shrink-0 sm:mx-0">
                <svg
                    class="lh-barrel-svg"
                    width="60mm"
                    height="215mm"
                    viewBox="0 0 60 215"
                    role="img"
                    :aria-label="$t('Printable barrel card')"
                >
                    <title>{{ $t('Printable barrel card') }}</title>
                    <rect
                        x="0.3"
                        y="0.3"
                        width="59.4"
                        height="214.4"
                        rx="2"
                        fill="#fff"
                        stroke="#888"
                        stroke-width="0.3"
                        stroke-dasharray="2 1.5"
                    />
                    <line
                        x1="30"
                        y1="16"
                        x2="30"
                        y2="200"
                        stroke="#9a9a9a"
                        stroke-width="0.3"
                        stroke-dasharray="1.5 1.5"
                    />

                    <!-- 50 mm check line -->
                    <line x1="5" y1="7" x2="55" y2="7" stroke="#222" stroke-width="0.35" />
                    <line x1="5" y1="5.5" x2="5" y2="8.5" stroke="#222" stroke-width="0.35" />
                    <line x1="55" y1="5.5" x2="55" y2="8.5" stroke="#222" stroke-width="0.35" />
                    <text x="30" y="12" text-anchor="middle" font-size="2.6" fill="#222">
                        {{ $t('50 mm – check with a ruler') }}
                    </text>

                    <g v-for="p in PAIRS" :key="p.n">
                        <path :d="barrelPath(30 - p.sep / 2, p.y, p.w, p.h)" :fill="RED" />
                        <path :d="hoops(30 - p.sep / 2, p.y, p.w, p.h)" stroke="#fff" stroke-width="0.35" fill="none" />
                        <path :d="barrelPath(30 + p.sep / 2, p.y, p.w, p.h)" :fill="GREEN" />
                        <path :d="hoops(30 + p.sep / 2, p.y, p.w, p.h)" stroke="#fff" stroke-width="0.35" fill="none" />
                        <text x="4" :y="p.y + 1.4" font-size="4" font-weight="700" fill="#333">
                            {{ p.n }}
                        </text>
                    </g>

                    <path d="M24 215 A6 6 0 0 1 36 215" fill="none" stroke="#888" stroke-width="0.3" />
                    <text x="30" y="206" text-anchor="middle" font-size="3.2" font-weight="700" fill="#333">
                        {{ $t('NOSE') }} ↓
                    </text>
                </svg>
            </div>

            <div class="min-w-0 text-sm">
                <h4 class="font-semibold">{{ $t('Printable card') }}</h4>
                <ul class="mt-2 list-disc space-y-1.5 pl-5 text-muted">
                    <li>{{ $t('In the print window choose “Actual size” or “Scale 100%”, not “Fit to page”.') }}</li>
                    <li>{{ $t('Check the 50 mm line with a ruler. If it is shorter or longer, the printer scaled the page.') }}</li>
                    <li>{{ $t('Colour printing is best; cut along the dashed line and glue the card on cardboard.') }}</li>
                    <li>{{ $t('Pairs: 1 = far (easiest), 3 = near (hardest).') }}</li>
                </ul>
                <button
                    type="button"
                    class="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
                    @click="print"
                >
                    {{ $t('Print the card') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

const PRINT_CLASS = 'lh-print-barrel';

/**
 * Barrel card in real millimetres (60 × 215 mm, fits A4). Pairs of a red and a
 * green barrel at 185, 120 and 60 mm from the nose end; the barrels grow with
 * the distance and their centres are about 1/10 of the eye distance apart, so
 * every pair asks for roughly the same extra convergence (crossed fusion).
 */
export default defineComponent({
    name: 'BarrelCard',

    setup() {
        return {
            RED: '#d7263d',
            GREEN: '#1b9e4b',
            PAIRS: [
                { n: 1, y: 30, sep: 20, w: 12, h: 16 },
                { n: 2, y: 95, sep: 14, w: 8, h: 11 },
                { n: 3, y: 155, sep: 8, w: 4.5, h: 6 },
            ],
        };
    },

    data() {
        return {
            cleanup: null as (() => void) | null,
        };
    },

    beforeUnmount() {
        this.cleanup?.();
    },

    methods: {
        barrelPath(cx: number, cy: number, w: number, h: number): string {
            const x0 = cx - w / 2;
            const x1 = cx + w / 2;
            const y0 = cy - h / 2;
            const y1 = cy + h / 2;
            const bulge = w * 0.12;
            const inset = w * 0.08;

            return (
                `M${x0 + inset} ${y0} L${x1 - inset} ${y0} ` +
                `Q${x1 + bulge} ${cy} ${x1 - inset} ${y1} ` +
                `L${x0 + inset} ${y1} Q${x0 - bulge} ${cy} ${x0 + inset} ${y0} Z`
            );
        },

        /** Two hoops across the barrel. */
        hoops(cx: number, cy: number, w: number, h: number): string {
            const half = w / 2;
            const a = cy - h * 0.22;
            const b = cy + h * 0.22;

            return `M${cx - half} ${a} L${cx + half} ${a} M${cx - half} ${b} L${cx + half} ${b}`;
        },

        /** Prints only the card, at 100% (print CSS below hides the rest of the page). */
        print(): void {
            this.cleanup?.();
            const body = document.body;
            const done = (): void => {
                body.classList.remove(PRINT_CLASS);
                window.removeEventListener('afterprint', done);
                window.clearTimeout(fallback);
                this.cleanup = null;
            };
            // some mobile browsers return from print() before printing and never fire afterprint
            const fallback = window.setTimeout(done, 60000);
            body.classList.add(PRINT_CLASS);
            window.addEventListener('afterprint', done);
            this.cleanup = done;
            window.print();
        },
    },
});
</script>

<style>
.lh-barrel-svg {
    display: block;
    width: 110px;
    height: auto;
    border-radius: 6px;
}

@media print {
    body.lh-print-barrel {
        background: #fff !important;
    }

    body.lh-print-barrel *:not(:has(.lh-barrel-sheet)):not(.lh-barrel-sheet):not(.lh-barrel-sheet *) {
        display: none !important;
    }

    body.lh-print-barrel *:has(.lh-barrel-sheet) {
        display: block !important;
        position: static !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: none !important;
        box-shadow: none !important;
        min-height: 0 !important;
        max-width: none !important;
        width: auto !important;
        overflow: visible !important;
    }

    body.lh-print-barrel .lh-barrel-sheet {
        display: block !important;
        margin: 0 !important;
    }

    body.lh-print-barrel .lh-barrel-svg {
        width: 60mm !important;
        height: 215mm !important;
        border-radius: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}
</style>
