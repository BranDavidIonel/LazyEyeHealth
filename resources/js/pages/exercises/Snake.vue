<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-snake">
            <main class="game-wrap">
                <div class="board-col">
                    <div class="stage"><canvas id="board"></canvas></div>
                    <div id="touchPad" class="touch-only touch-pad">
                        <div class="dpad">
                            <button
                                class="btn up"
                                type="button"
                                data-dir="up"
                                :aria-label="$t('Up')"
                            >
                                ↑
                            </button>
                            <button
                                class="btn left"
                                type="button"
                                data-dir="left"
                                :aria-label="$t('Left')"
                            >
                                ←
                            </button>
                            <button
                                class="btn down"
                                type="button"
                                data-dir="down"
                                :aria-label="$t('Down')"
                            >
                                ↓
                            </button>
                            <button
                                class="btn right"
                                type="button"
                                data-dir="right"
                                :aria-label="$t('Right')"
                            >
                                →
                            </button>
                        </div>
                        <button
                            id="tPause"
                            class="btn pause"
                            type="button"
                            :aria-label="$t('Pause')"
                        >
                            ❚❚
                        </button>
                    </div>
                </div>
                <aside class="side">
                    <div class="stat">
                        <span>{{ $t('Score') }}</span><b id="sScore">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Length') }}</span><b id="sLength">3</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Level') }}</span><b id="sLevel">1</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Best score') }}</span><b id="sBest">0</b>
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
                        <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd>
                        {{ $t('or') }} <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd>
                        <kbd>D</kbd>: {{ $t('change direction') }}<br />
                        <kbd>{{ $t('Space') }}</kbd> {{ $t('or') }}
                        <kbd>P</kbd> {{ $t('pause') }}
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
import start from '@/exercises/snake';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'SnakeExercise',

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
.ex-snake .board-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.ex-snake .keys {
    font-size: 0.88rem;
    color: var(--muted);
    line-height: 1.9;
}

.ex-snake .side .row .btn {
    flex: 1;
}

.ex-snake .touch-pad {
    gap: 16px;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
}

.ex-snake .dpad {
    display: grid;
    grid-template-columns: repeat(3, 64px);
    grid-template-rows: repeat(2, 56px);
    gap: 8px;
}

.ex-snake .touch-pad .btn {
    width: 64px;
    height: 56px;
    font-size: 1.4rem;
    padding: 0;
    touch-action: none;
}

.ex-snake .dpad .up {
    grid-column: 2;
    grid-row: 1;
}

.ex-snake .dpad .left {
    grid-column: 1;
    grid-row: 2;
}

.ex-snake .dpad .down {
    grid-column: 2;
    grid-row: 2;
}

.ex-snake .dpad .right {
    grid-column: 3;
    grid-row: 2;
}

.ex-snake .touch-pad .btn.pause {
    font-size: 1rem;
}
</style>
