<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <main class="game-wrap">
            <div class="stage"><canvas id="cv"></canvas></div>
            <aside class="side">
                <div id="instr" class="instr"></div>
                <p id="calHint" class="hint" hidden></p>
                <button id="startBtn" class="btn primary big wide">
                    Start
                </button>
                <div class="progress"><i id="prog"></i></div>
                <div class="stat">
                    <span>Încercare</span><b id="sTrial">0 / 60</b>
                </div>
                <div class="stat"><span>Corecte</span><b id="sAcc">–</b></div>
                <div class="stat"><span>Puncte</span><b id="sPts">0</b></div>
                <div class="stat">
                    <span>Decalaj acum</span><b id="sNow">–</b>
                </div>
                <p class="q">
                    Linia de jos e mutată la stânga sau la dreapta?<br /><kbd
                        >←</kbd
                    >
                    stânga &nbsp; <kbd>→</kbd> dreapta
                </p>
                <div class="resp-row">
                    <button id="bL" class="btn resp" aria-label="La stânga">
                        ←
                    </button>
                    <button id="bR" class="btn resp" aria-label="La dreapta">
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
