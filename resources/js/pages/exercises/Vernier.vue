<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
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
                    <span>{{ $t('Trial') }}</span><b id="sTrial">0 / 60</b>
                </div>
                <div class="stat">
                    <span>{{ $t('Correct answers') }}</span><b id="sAcc">–</b>
                </div>
                <div class="stat">
                    <span>{{ $t('Points') }}</span><b id="sPts">0</b>
                </div>
                <div class="stat">
                    <span>{{ $t('Offset now') }}</span><b id="sNow">–</b>
                </div>
                <p class="q">
                    {{ $t('Is the lower line shifted to the left or to the right?')
                    }}<br />
                    <span
                        v-html="$t('<kbd>←</kbd> left &nbsp; <kbd>→</kbd> right')"
                    ></span>
                </p>
                <div class="resp-row">
                    <button
                        id="bL"
                        class="btn resp"
                        :aria-label="$t('To the left')"
                    >
                        ←
                    </button>
                    <button
                        id="bR"
                        class="btn resp"
                        :aria-label="$t('To the right')"
                    >
                        →
                    </button>
                </div>
                <div id="fb" class="feedback"></div>
            </aside>
        </main>
    </ExerciseShell>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseShell from '@/components/exercise/ExerciseShell.vue';
import start from '@/exercises/vernier';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'VernierExercise',

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
