<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-ring">
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
                        <span>{{ $t('Time') }}</span><b id="sTime">60 s</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Found') }}</span><b id="sFound">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Points') }}</span><b id="sPts">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Size (gap)') }}</span><b id="sSize">–</b>
                    </div>
                    <p class="hint">
                        {{
                            $t(
                                'All the rings are closed, except one that has a small gap. Tap it as fast as you can.',
                            )
                        }}
                    </p>
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
import start from '@/exercises/ring';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'RingExercise',

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
.ex-ring .stage canvas {
    cursor: crosshair;
}
</style>
