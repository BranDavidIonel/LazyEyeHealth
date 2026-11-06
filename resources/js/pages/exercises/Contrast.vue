<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-contrast">
            <main class="game-wrap">
                <div class="stage"><canvas id="cv"></canvas></div>
                <aside class="side">
                    <div id="instr" class="instr"></div>
                    <p id="calHint" class="hint" hidden></p>
                    <label class="field">
                        <span class="label">{{
                            $t('Spatial frequency (stripe fineness)')
                        }}</span>
                        <select id="sf">
                            <option value="1.5">
                                {{ $t('1.5 cycles/degree (wide stripes)') }}
                            </option>
                            <option value="3">
                                {{ $t(':n cycles/degree', { n: 3 }) }}
                            </option>
                            <option value="6" selected>
                                {{ $t(':n cycles/degree', { n: 6 }) }}
                            </option>
                            <option value="9">
                                {{ $t(':n cycles/degree', { n: 9 }) }}
                            </option>
                            <option value="12">
                                {{ $t('12 cycles/degree (fine stripes)') }}
                            </option>
                        </select>
                    </label>
                    <p id="sfWarn" class="hint warn" hidden></p>
                    <label class="field">
                        <span class="label">{{ $t('Display time') }}</span>
                        <select id="dur">
                            <option value="0.3">{{ $t('0.3 s') }}</option>
                            <option value="0.5" selected>
                                {{ $t('0.5 s') }}
                            </option>
                            <option value="1">1 s</option>
                            <option value="0">{{ $t('Until I answer') }}</option>
                        </select>
                    </label>
                    <button id="startBtn" class="btn primary big wide">
                        {{ $t('Start') }}
                    </button>
                    <div class="progress"><i id="prog"></i></div>
                    <div class="stat">
                        <span>{{ $t('Trial') }}</span><b id="sTrial">0 / 70</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Correct answers') }}</span
                        ><b id="sAcc">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Points') }}</span><b id="sPts">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Contrast now') }}</span
                        ><b id="sNow">–</b>
                    </div>
                    <p class="q">
                        {{
                            $t(
                                'Are the stripes tilted to the left or to the right?',
                            )
                        }}<br /><kbd>←</kbd> {{ $t('left') }} ╲ &nbsp;
                        <kbd>→</kbd> {{ $t('right') }} ╱
                    </p>
                    <div class="resp-row">
                        <button
                            id="bL"
                            class="btn resp"
                            :aria-label="$t('Tilted to the left')"
                        >
                            ╲
                        </button>
                        <button
                            id="bR"
                            class="btn resp"
                            :aria-label="$t('Tilted to the right')"
                        >
                            ╱
                        </button>
                    </div>
                    <div id="fb" class="feedback"></div>
                </aside>
            </main>
        </div>
    </ExerciseShell>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseShell from '@/components/exercise/ExerciseShell.vue';
import start from '@/exercises/contrast';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'ContrastExercise',

    components: { ExerciseShell },

    props: {
        exercise: { type: Object as PropType<ExerciseMeta>, required: true },
        results: { type: Object as PropType<ResultMap>, required: true },
    },

    setup() {
        return { start };
    },
});
</script>

<style>
.ex-contrast .warn {
    color: var(--warn);
}
</style>
