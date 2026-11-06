<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-stereo">
            <main class="game-wrap">
                <div class="stage"><canvas id="cv"></canvas></div>
                <aside class="side">
                    <div id="instr" class="instr"></div>
                    <p id="calHint" class="hint" hidden></p>
                    <button id="startBtn" class="btn primary big wide">
                        {{ $t('Start') }}
                    </button>
                    <div class="progress"><i id="prog"></i></div>
                    <div class="stat">
                        <span>{{ $t('Trial') }}</span><b id="sTrial">0 / 50</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Correct answers') }}</span
                        ><b id="sAcc">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Points') }}</span><b id="sPts">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Depth difference now') }}</span
                        ><b id="sNow">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Smallest step here') }}</span
                        ><b id="sMin">–</b>
                    </div>
                    <p class="q">
                        {{ $t('Where does the square stand out?') }}<br />
                        <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>
                        {{ $t('or') }} <kbd>1</kbd>–<kbd>4</kbd>
                    </p>
                    <div class="pad">
                        <button
                            class="btn resp up"
                            data-d="up"
                            :aria-label="$t('Up')"
                        >
                            ↑<small>1</small>
                        </button>
                        <button
                            class="btn resp left"
                            data-d="left"
                            :aria-label="$t('Left')"
                        >
                            ←<small>3</small>
                        </button>
                        <button
                            class="btn resp down"
                            data-d="down"
                            :aria-label="$t('Down')"
                        >
                            ↓<small>2</small>
                        </button>
                        <button
                            class="btn resp right"
                            data-d="right"
                            :aria-label="$t('Right')"
                        >
                            →<small>4</small>
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
import start from '@/exercises/stereo';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'StereoExercise',

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
.ex-stereo .pad .up {
    grid-column: 2;
    grid-row: 1;
}

.ex-stereo .pad .left {
    grid-column: 1;
    grid-row: 2;
}

.ex-stereo .pad .down {
    grid-column: 2;
    grid-row: 2;
}

.ex-stereo .pad .right {
    grid-column: 3;
    grid-row: 2;
}

.ex-stereo .pad .resp {
    position: relative;
}

.ex-stereo .pad .resp small {
    position: absolute;
    right: 6px;
    bottom: 3px;
    font-size: 0.7rem;
    line-height: 1;
    color: var(--muted);
}
</style>
