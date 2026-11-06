<template>
    <!-- Brock string, seen from above -->
    <svg
        v-if="name === 'brockTop'"
        class="pf-svg"
        viewBox="0 0 200 250"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <rect x="88" y="6" width="24" height="10" rx="2" class="pf-ink" />
        <text x="118" y="15" class="pf-text">{{ $t('door handle') }}</text>
        <line x1="100" y1="16" x2="100" y2="198" class="pf-ink" />
        <line x1="86" y1="213" x2="100" y2="110" class="pf-sight" />
        <line x1="114" y1="213" x2="100" y2="110" class="pf-sight" />
        <circle cx="100" cy="46" r="6" :fill="GREEN" />
        <circle cx="100" cy="110" r="6" :fill="YELLOW" />
        <circle cx="100" cy="160" r="6" :fill="RED" />
        <text x="112" y="50" class="pf-text">{{ $t('~1.5 m') }}</text>
        <text x="112" y="114" class="pf-text">~80 cm</text>
        <text x="112" y="164" class="pf-text">~40 cm</text>
        <ellipse cx="100" cy="226" rx="36" ry="20" class="pf-skin" />
        <path d="M93 208 L100 196 L107 208 Z" class="pf-skin" />
        <ellipse cx="86" cy="213" rx="6" ry="3" class="pf-fill-ink" />
        <ellipse cx="114" cy="213" rx="6" ry="3" class="pf-fill-ink" />
        <text x="58" y="217" text-anchor="end" class="pf-text">
            {{ eyeName('left') }}
        </text>
        <text x="142" y="217" class="pf-text">{{ eyeName('right') }}</text>
    </svg>

    <!-- Brock string: what you should see -->
    <svg
        v-else-if="name === 'brockView'"
        class="pf-svg"
        viewBox="0 0 200 250"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <line x1="53.6" y1="236" x2="140" y2="20" class="pf-ink" />
        <line x1="146.4" y1="236" x2="60" y2="20" class="pf-ink" />
        <circle cx="126" cy="55" r="5.5" :fill="GREEN" />
        <circle cx="74" cy="55" r="5.5" :fill="GREEN" />
        <circle cx="100" cy="120" r="6.5" :fill="YELLOW" />
        <circle cx="78" cy="175" r="5.5" :fill="RED" />
        <circle cx="122" cy="175" r="5.5" :fill="RED" />
        <text x="114" y="132" class="pf-text-strong">
            {{ $t('you look here') }}
        </text>
        <text x="100" y="248" text-anchor="middle" class="pf-text">
            {{ $t('the strings cross in the bead (X)') }}
        </text>
    </svg>

    <!-- Brock string: signs -->
    <svg
        v-else-if="name === 'brockSigns'"
        class="pf-svg"
        viewBox="0 0 330 150"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <rect x="1" y="1" width="98" height="114" rx="8" class="pf-frame" />
        <rect x="116" y="1" width="98" height="114" rx="8" class="pf-frame" />
        <rect x="231" y="1" width="98" height="114" rx="8" class="pf-frame" />

        <line x1="32.5" y1="110" x2="67.5" y2="10" class="pf-ink" />
        <line x1="67.5" y1="110" x2="32.5" y2="10" class="pf-ink" />
        <circle cx="50" cy="60" r="5.5" :fill="YELLOW" />

        <line x1="139.5" y1="110" x2="169.5" y2="10" class="pf-ink" />
        <line x1="190.5" y1="110" x2="160.5" y2="10" class="pf-ink" />
        <circle cx="151.5" cy="70" r="5" :fill="YELLOW" />
        <circle cx="178.5" cy="70" r="5" :fill="YELLOW" />

        <line x1="262" y1="110" x2="298" y2="10" class="pf-ink" />
        <circle cx="280" cy="60" r="5.5" :fill="YELLOW" />

        <text x="50" y="131" text-anchor="middle" class="pf-text-strong">
            {{ $t('Correct') }}
        </text>
        <text x="50" y="145" text-anchor="middle" class="pf-text">
            {{ $t('X in the bead') }}
        </text>
        <text x="165" y="131" text-anchor="middle" class="pf-text-strong">
            {{ $t('Weak convergence') }}
        </text>
        <text x="165" y="145" text-anchor="middle" class="pf-text">
            {{ $t('X behind, or a V') }}
        </text>
        <text x="280" y="131" text-anchor="middle" class="pf-text-strong">
            {{ $t('One eye off') }}
        </text>
        <text x="280" y="145" text-anchor="middle" class="pf-text">
            {{ $t('only one string') }}
        </text>
    </svg>

    <!-- Pencil push-ups with a ruler -->
    <svg
        v-else-if="name === 'pencil'"
        class="pf-svg"
        viewBox="0 0 360 175"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <path :d="PROFILE" class="pf-skin" />
        <path d="M50 66 Q56 62 62 66 Q56 70 50 66 Z" class="pf-fill-ink" />
        <line x1="60" y1="66" x2="150" y2="66" class="pf-sight" />
        <polygon points="150,66 162,61 162,71" fill="#e8c39e" />
        <polygon points="150,66 155,64 155,68" class="pf-fill-ink" />
        <rect x="162" y="61" width="100" height="10" :fill="YELLOW" />
        <rect x="262" y="61" width="10" height="10" :fill="RED" />
        <text x="205" y="69.5" font-size="8" font-weight="700" fill="#4a3300">
            E
        </text>
        <line x1="142" y1="44" x2="98" y2="44" class="pf-ink" />
        <path d="M104 39 L97 44 L104 49" class="pf-ink" />
        <text x="120" y="36" text-anchor="middle" class="pf-text">
            {{ $t('slowly, 2–3 cm/s') }}
        </text>
        <line x1="150" y1="73" x2="150" y2="136" class="pf-sight" />
        <text x="156" y="112" class="pf-text-strong">
            {{ $t('break point') }}
        </text>
        <rect x="64" y="132" width="60" height="4" class="pf-warn-fill" />
        <text x="94" y="127" text-anchor="middle" class="pf-text">
            {{ $t('under 6 cm') }}
        </text>
        <rect x="60" y="138" width="292" height="22" rx="2" class="pf-paper" />
        <line
            v-for="cm in RULER"
            :key="cm"
            :x1="64 + cm * 10"
            y1="138"
            :x2="64 + cm * 10"
            :y2="cm % 5 === 0 ? 148 : 143"
            stroke="#333"
            stroke-width="0.8"
        />
        <text
            v-for="cm in [0, 5, 10, 15, 20, 25]"
            :key="`l${cm}`"
            :x="64 + cm * 10"
            y="157"
            text-anchor="middle"
            font-size="8"
            fill="#333"
        >
            {{ cm }}
        </text>
        <text x="346" y="157" text-anchor="end" font-size="8" fill="#333">
            cm
        </text>
    </svg>

    <!-- Barrel card, seen from above, and what you see -->
    <svg
        v-else-if="name === 'barrel'"
        class="pf-svg"
        viewBox="0 0 360 210"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <rect x="110" y="18" width="60" height="152" rx="2" class="pf-paper" />
        <line
            x1="140"
            y1="22"
            x2="140"
            y2="166"
            stroke="#999"
            stroke-width="0.8"
            stroke-dasharray="3 3"
        />
        <path :d="barrelPath(129, 40, 10, 13)" :fill="BARREL_RED" />
        <path :d="barrelPath(151, 40, 10, 13)" :fill="BARREL_GREEN" />
        <path :d="barrelPath(133.5, 86, 7, 9)" :fill="BARREL_RED" />
        <path :d="barrelPath(146.5, 86, 7, 9)" :fill="BARREL_GREEN" />
        <path :d="barrelPath(136.5, 130, 4.5, 6)" :fill="BARREL_RED" />
        <path :d="barrelPath(143.5, 130, 4.5, 6)" :fill="BARREL_GREEN" />
        <text x="104" y="44" text-anchor="end" class="pf-text">1</text>
        <text x="104" y="90" text-anchor="end" class="pf-text">2</text>
        <text x="104" y="134" text-anchor="end" class="pf-text">3</text>
        <line x1="126" y1="182" x2="151" y2="40" class="pf-sight" />
        <line x1="154" y1="182" x2="129" y2="40" class="pf-sight" />
        <line
            x1="140"
            y1="108"
            x2="140"
            y2="150"
            :stroke="YELLOW"
            stroke-width="4"
        />
        <polygon points="140,102 137.5,108 142.5,108" fill="#e8c39e" />
        <text x="146" y="118" class="pf-text">{{ $t('pencil') }}</text>
        <ellipse cx="140" cy="192" rx="38" ry="16" class="pf-skin" />
        <path d="M134 179 L140 168 L146 179 Z" class="pf-skin" />
        <ellipse cx="126" cy="182" rx="5.5" ry="2.8" class="pf-fill-ink" />
        <ellipse cx="154" cy="182" rx="5.5" ry="2.8" class="pf-fill-ink" />

        <text x="292" y="36" text-anchor="middle" class="pf-text-strong">
            {{ $t('What you see') }}
        </text>
        <path :d="barrelPath(256, 80, 22, 28)" :fill="BARREL_RED" />
        <path
            :d="barrelPath(292, 80, 22, 28)"
            :fill="BARREL_RED"
            opacity="0.7"
        />
        <path
            :d="barrelPath(292, 80, 22, 28)"
            :fill="BARREL_GREEN"
            opacity="0.55"
        />
        <path :d="barrelPath(328, 80, 22, 28)" :fill="BARREL_GREEN" />
        <text x="292" y="114" text-anchor="middle" class="pf-text-strong">
            {{ $t('joined: red + green') }}
        </text>
        <text x="292" y="130" text-anchor="middle" class="pf-text">
            {{ $t('the other pairs: double') }}
        </text>
    </svg>

    <!-- Near - far -->
    <svg
        v-else-if="name === 'nearfar'"
        class="pf-svg"
        viewBox="0 0 360 170"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <path :d="PROFILE" class="pf-skin" />
        <path d="M50 66 Q56 62 62 66 Q56 70 50 66 Z" class="pf-fill-ink" />
        <line x1="60" y1="66" x2="120" y2="72" class="pf-sight" />
        <line x1="60" y1="66" x2="300" y2="46" class="pf-sight" />
        <rect x="120" y="56" width="26" height="34" rx="1.5" class="pf-paper" />
        <line
            v-for="i in 5"
            :key="i"
            x1="124"
            :y1="60 + i * 5"
            x2="142"
            :y2="60 + i * 5"
            stroke="#555"
            stroke-width="1"
        />
        <text x="133" y="104" text-anchor="middle" class="pf-text">
            ~40 cm
        </text>
        <line x1="352" y1="8" x2="352" y2="162" class="pf-line" />
        <rect x="300" y="18" width="44" height="60" rx="1.5" class="pf-paper" />
        <text
            x="322"
            y="42"
            text-anchor="middle"
            font-size="16"
            font-weight="700"
            fill="#222"
        >
            E
        </text>
        <text x="322" y="58" text-anchor="middle" font-size="10" fill="#222">
            F P
        </text>
        <text x="322" y="71" text-anchor="middle" font-size="7" fill="#222">
            T O Z
        </text>
        <text x="322" y="94" text-anchor="middle" class="pf-text">~3 m</text>
        <path d="M152 118 Q226 150 300 110" class="pf-ink" />
        <path d="M160 113 L152 118 L161 123" class="pf-ink" />
        <path d="M290 108 L300 110 L294 118" class="pf-ink" />
        <text x="226" y="160" text-anchor="middle" class="pf-text-strong">
            {{ $t('near ↔ far') }}
        </text>
    </svg>

    <!-- Patching the good eye with near work -->
    <svg
        v-else-if="name === 'patching'"
        class="pf-svg"
        viewBox="0 0 300 200"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <circle cx="150" cy="80" r="58" class="pf-skin" />
        <template v-for="x in [126, 174]" :key="x">
            <template v-if="x === patchX">
                <ellipse
                    :cx="x"
                    cy="72"
                    rx="16"
                    ry="12"
                    fill="#d9b48f"
                    class="pf-patch"
                />
            </template>
            <template v-else>
                <ellipse :cx="x" cy="72" rx="11" ry="7" class="pf-eye" />
                <circle :cx="x" cy="72" r="4.5" class="pf-iris" />
                <circle :cx="x" cy="72" r="1.8" fill="#111" />
            </template>
        </template>
        <path d="M150 80 L144 98 L153 100" class="pf-line" />
        <path d="M134 112 Q150 122 166 112" class="pf-line" />
        <line
            :x1="patchX"
            y1="58"
            :x2="patchX"
            y2="24"
            class="pf-line"
        />
        <text x="150" y="16" text-anchor="middle" class="pf-text-strong">
            {{ $t('patch on the good eye') }}
        </text>
        <line
            :x1="openX"
            y1="80"
            :x2="openX < 150 ? 128 : 172"
            y2="166"
            class="pf-sight"
        />
        <path
            d="M90 166 L150 158 L210 166 L210 196 L150 188 L90 196 Z"
            class="pf-paper"
        />
        <line x1="150" y1="158" x2="150" y2="188" stroke="#999" />
        <line
            v-for="i in 3"
            :key="`a${i}`"
            x1="100"
            :y1="166 + i * 6"
            x2="142"
            :y2="162 + i * 6"
            stroke="#777"
            stroke-width="1"
        />
        <line
            v-for="i in 3"
            :key="`b${i}`"
            x1="158"
            :y1="162 + i * 6"
            x2="200"
            :y2="166 + i * 6"
            stroke="#777"
            stroke-width="1"
        />
    </svg>

    <!-- The drifting eye -->
    <svg
        v-else-if="name === 'drift'"
        class="pf-svg"
        viewBox="0 0 300 200"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <circle cx="150" cy="80" r="58" class="pf-skin" />
        <template v-for="x in [126, 174]" :key="x">
            <ellipse :cx="x" cy="72" rx="11" ry="7" class="pf-eye" />
            <circle
                :cx="x === lazyX ? x + driftDir * 5.5 : x"
                cy="72"
                r="4.5"
                class="pf-iris"
            />
            <circle
                :cx="x === lazyX ? x + driftDir * 5.5 : x"
                cy="72"
                r="1.8"
                fill="#111"
            />
        </template>
        <path d="M150 80 L144 98 L153 100" class="pf-line" />
        <path d="M134 112 Q150 122 166 112" class="pf-line" />
        <path
            :d="`M${lazyX + driftDir * 14} 66 Q ${lazyX + driftDir * 30} 52 ${lazyX + driftDir * 46} 58`"
            class="pf-warn-line"
        />
        <path
            :d="`M${lazyX + driftDir * 40} 52 L ${lazyX + driftDir * 47} 58 L ${lazyX + driftDir * 39} 62`"
            class="pf-warn-line"
        />
        <text
            :x="lazyX + driftDir * 30"
            y="40"
            text-anchor="middle"
            class="pf-text-strong"
        >
            {{ $t('drifts towards the ear') }}
        </text>
        <line x1="126" y1="78" x2="150" y2="160" class="pf-sight" />
        <line x1="174" y1="78" x2="150" y2="160" class="pf-sight" />
        <rect x="144" y="160" width="12" height="38" rx="6" class="pf-skin" />
        <text x="150" y="152" text-anchor="middle" class="pf-text-strong">
            {{ $t('look near: the eye comes back') }}
        </text>
    </svg>

    <!-- 20-20-20 -->
    <svg
        v-else-if="name === 'rest'"
        class="pf-svg"
        viewBox="0 0 360 150"
        role="img"
        :aria-label="label"
    >
        <title>{{ label }}</title>
        <rect x="20" y="30" width="90" height="58" rx="4" class="pf-ink" />
        <path d="M58 88 L72 88 L78 100 L52 100 Z" class="pf-line" />
        <text x="65" y="64" text-anchor="middle" class="pf-text-strong">
            20 min
        </text>
        <line x1="118" y1="60" x2="150" y2="60" class="pf-ink" />
        <path d="M144 55 L151 60 L144 65" class="pf-ink" />
        <circle cx="180" cy="60" r="20" class="pf-ink" />
        <line x1="180" y1="60" x2="180" y2="46" class="pf-ink" />
        <line x1="180" y1="60" x2="190" y2="64" class="pf-ink" />
        <text x="180" y="100" text-anchor="middle" class="pf-text-strong">
            20 s
        </text>
        <line x1="208" y1="60" x2="272" y2="60" class="pf-sight" />
        <path d="M266 55 L273 60 L266 65" class="pf-ink" />
        <rect x="300" y="70" width="8" height="30" fill="#8a6a4a" />
        <circle cx="304" cy="58" r="20" :fill="GREEN" opacity="0.85" />
        <text x="304" y="118" text-anchor="middle" class="pf-text-strong">
            ≥ 6 m
        </text>
        <text x="180" y="138" text-anchor="middle" class="pf-text">
            {{ $t('+ blink fully 10 times') }}
        </text>
    </svg>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import type { FigureName } from '@/components/physical/guide';

/** Simple line drawings of the off-screen exercises (they follow the colour theme). */
export default defineComponent({
    name: 'PhysicalFigure',

    props: {
        name: { type: String as PropType<FigureName>, required: true },
        /** Text for screen readers (the caption). */
        label: { type: String, required: true },
    },

    setup() {
        return {
            RED: '#e5484d',
            YELLOW: '#f2b600',
            GREEN: '#2f9e44',
            BARREL_RED: '#d7263d',
            BARREL_GREEN: '#1b9e4b',
            RULER: Array.from({ length: 29 }, (_, i) => i),
            // head in profile, looking right; the nose bridge is at x = 64
            PROFILE:
                'M30 14 C 52 12 62 28 62 50 L 64 58 L 80 84 L 66 90 L 68 100 L 64 104 L 68 112 C 66 124 58 132 46 134 L 40 168 L 14 168 L 14 14 Z',
        };
    },

    computed: {
        /** The face is drawn from the front: the person's right eye is on the viewer's left. */
        lazyX(): number {
            return Amb.settings().lazyEye === 'right' ? 126 : 174;
        },

        /** -1 = towards the viewer's left (the right eye's ear), +1 = towards the right. */
        driftDir(): number {
            return Amb.settings().lazyEye === 'right' ? -1 : 1;
        },

        patchX(): number {
            return Amb.settings().lazyEye === 'right' ? 174 : 126;
        },

        openX(): number {
            return this.lazyX;
        },
    },

    methods: {
        eyeName(eye: 'left' | 'right'): string {
            return Amb.EYE[eye];
        },

        /** A barrel standing up, centred at (cx, cy). */
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
    },
});
</script>

<style>
.pf-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
}

.pf-svg text {
    font-family: inherit;
}

.pf-ink {
    fill: none;
    stroke: var(--color-fg);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.pf-line {
    fill: none;
    stroke: var(--color-muted);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.pf-frame {
    fill: var(--color-panel);
    stroke: var(--color-line);
}

.pf-sight {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 1.4;
    stroke-dasharray: 4 3;
}

.pf-skin {
    fill: var(--color-panel-2);
    stroke: var(--color-muted);
    stroke-width: 1.4;
    stroke-linejoin: round;
}

.pf-fill-ink {
    fill: var(--color-fg);
}

.pf-eye {
    fill: #fff;
    stroke: var(--color-muted);
    stroke-width: 1.2;
}

.pf-iris {
    fill: var(--color-accent);
}

.pf-patch {
    stroke: var(--color-muted);
    stroke-width: 1.2;
}

.pf-paper {
    fill: #fff;
    stroke: var(--color-line-2);
    stroke-width: 1;
}

.pf-warn-fill {
    fill: var(--color-warn);
}

.pf-warn-line {
    fill: none;
    stroke: var(--color-warn);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 4 3;
}

.pf-text {
    fill: var(--color-muted);
    font-size: 11px;
}

.pf-text-strong {
    fill: var(--color-fg);
    font-size: 11px;
    font-weight: 600;
}
</style>
