<template>
    <div class="space-y-5">
        <div class="panel p-5">
            <h2 class="mb-3 font-semibold">{{ $t('1. Which eye do you test?') }}</h2>
            <div class="flex flex-wrap gap-2" role="radiogroup" :aria-label="$t('Eye')">
                <button
                    v-for="option in eyes"
                    :key="option.value"
                    type="button"
                    role="radio"
                    :aria-checked="eye === option.value"
                    class="rounded-lg border px-4 py-2.5 text-left text-sm"
                    :class="eye === option.value ? 'border-accent bg-accent/15 text-fg' : 'border-line-2 text-muted hover:text-fg'"
                    @click="$emit('update:eye', option.value)"
                >
                    <b class="block">{{ $t(option.label) }}</b>
                    <span class="text-xs">{{ $t(option.hint) }}</span>
                </button>
            </div>
            <p class="mt-3 text-sm text-muted">{{ coverText }}</p>
        </div>

        <div class="panel p-5">
            <h2 class="mb-3 font-semibold">{{ $t('2. Distance to the screen') }}</h2>
            <div class="flex flex-wrap items-center gap-2">
                <button
                    v-for="cm in distances"
                    :key="cm"
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm tabular-nums"
                    :class="distance === cm ? 'border-accent bg-accent/15 text-fg' : 'border-line-2 text-muted hover:text-fg'"
                    @click="$emit('update:distance', cm)"
                >
                    {{ cm }} cm
                </button>
                <label class="ml-2 flex items-center gap-2 text-sm text-muted">
                    {{ $t('other:') }}
                    <input
                        type="number"
                        min="20"
                        max="600"
                        class="form-control w-24 py-1.5"
                        :value="distance"
                        @change="onDistance"
                    />
                    cm
                </label>
            </div>
            <p class="mt-3 text-sm text-muted">{{ $t(distanceHint) }}</p>
            <p class="mt-1 text-sm text-muted">
                {{ $t('Measure from your eyes to the screen with a tape measure, and use the same distance every time: only then the tests can be compared.') }}
            </p>
            <p v-if="range" class="mt-2 text-sm">{{ range }}</p>
        </div>

        <div class="panel p-5 text-sm">
            <h2 class="mb-2 font-semibold">{{ $t('3. Before you start') }}</h2>
            <ul class="list-disc space-y-1 pl-5 text-muted">
                <li>{{ $t('Wear your usual glasses or contact lenses (not the red-cyan glasses).') }}</li>
                <li>{{ $t('Normal room light, screen brightness medium to high, no glare on the screen.') }}</li>
                <li>{{ $t('Rested eyes: not right after a long exercise session.') }}</li>
                <li>{{ $t('Guess when you are not sure: guessing is part of the method.') }}</li>
                <li>{{ $t('For a reliable result take the test twice in a row: the comparison uses the average of the day.') }}</li>
            </ul>
            <p v-if="!sizeCalibrated" class="mt-3 rounded-lg border border-warn/40 bg-warn/10 p-3 text-warn">
                {{ $t('The screen size is not calibrated yet, so the letter sizes are only approximate.') }}
                <Link href="/calibrare" class="font-semibold">{{ $t('Calibrate the screen (bank card, 1 minute)') }}</Link>
            </p>
        </div>

        <slot />
    </div>
</template>

<script lang="ts">
import { Link } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import { t } from '@/i18n';
import type { EyeKey } from '@/types';

/** Shared first screen of the vision tests: eye, distance, conditions. */
export default defineComponent({
    name: 'TestSetup',

    components: { Link },

    props: {
        eye: { type: String as PropType<EyeKey>, required: true },
        distance: { type: Number, required: true },
        distances: { type: Array as PropType<number[]>, required: true },
        distanceHint: { type: String, default: '' },
        /** Text with the smallest / largest line that fit at this distance. */
        range: { type: String, default: '' },
    },

    emits: ['update:eye', 'update:distance'],

    computed: {
        lazyEye(): string {
            return Amb.settings().lazyEye;
        },

        eyes(): { value: EyeKey; label: string; hint: string }[] {
            const lazy = this.lazyEye;
            const list: { value: EyeKey; label: string; hint: string }[] = [
                { value: 'right', label: 'Right eye', hint: lazy === 'right' ? 'the lazy eye' : 'the good eye' },
                { value: 'left', label: 'Left eye', hint: lazy === 'left' ? 'the lazy eye' : 'the good eye' },
                { value: 'both', label: 'Both eyes', hint: 'together' },
            ];

            return list.sort((a, b) => (a.value === lazy ? -1 : b.value === lazy ? 1 : 0));
        },

        coverText(): string {
            if (this.eye === 'both') {
                return t('Both eyes open.');
            }

            return t('Cover the :other eye with your palm or a patch, without pressing on it. Keep both eyes open behind the cover.', {
                other: this.eye === 'right' ? Amb.EYE.left : Amb.EYE.right,
            });
        },

        sizeCalibrated(): boolean {
            return Amb.settings().sizeCalibrated;
        },
    },

    methods: {
        onDistance(event: Event): void {
            const value = Math.round(Number((event.target as HTMLInputElement).value));

            if (value >= 20 && value <= 600) {
                this.$emit('update:distance', value);
            }
        },
    },
});
</script>
