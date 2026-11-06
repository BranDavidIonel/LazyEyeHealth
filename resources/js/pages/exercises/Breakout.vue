<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-breakout">
            <main class="game-wrap">
                <div class="stage"><canvas id="game"></canvas></div>
                <aside class="side">
                    <div class="stat">
                        <span>{{ $t('Score') }}</span><b id="sScore">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Lives') }}</span><b id="sLives">3</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Level') }}</span><b id="sLevel">1</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Good eye contrast') }}</span
                        ><b id="sFc"></b>
                    </div>
                    <div class="row">
                        <button id="bStart" class="btn primary" type="button">
                            {{ $t('Start') }}
                        </button>
                        <button id="bPause" class="btn" type="button">
                            {{ $t('Pause (P)') }}
                        </button>
                    </div>
                    <div class="keys">
                        {{ $t('Mouse / finger on the game or') }}
                        <kbd>←</kbd> <kbd>→</kbd> (<kbd>A</kbd> <kbd>D</kbd>):
                        {{ $t('move the paddle') }}<br />
                        <kbd>{{ $t('Space') }}</kbd>, <kbd>↑</kbd>
                        {{ $t('or click: launch the ball') }} · <kbd>P</kbd>
                        {{ $t('pause') }}
                    </div>
                    <div id="instr" class="instr"></div>
                </aside>
            </main>
        </div>
    </ExerciseShell>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseShell from '@/components/exercise/ExerciseShell.vue';
import start from '@/exercises/breakout';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'BreakoutExercise',

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
.ex-breakout .keys {
    font-size: 0.88rem;
    color: var(--muted);
    line-height: 1.9;
}

.ex-breakout .side .row .btn {
    flex: 1;
}
</style>
