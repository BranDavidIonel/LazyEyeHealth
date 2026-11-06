<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-tetris">
            <main class="game-wrap">
                <div class="board-col">
                    <div class="stage"><canvas id="board"></canvas></div>
                    <div id="touchPad" class="touch-only touch-pad">
                        <button
                            class="btn"
                            type="button"
                            data-act="left"
                            :aria-label="$t('Left')"
                        >
                            ←
                        </button>
                        <button
                            class="btn"
                            type="button"
                            data-act="rotate"
                            :aria-label="$t('Rotate')"
                        >
                            ↻
                        </button>
                        <button
                            class="btn"
                            type="button"
                            data-act="right"
                            :aria-label="$t('Right')"
                        >
                            →
                        </button>
                        <button
                            class="btn"
                            type="button"
                            data-act="down"
                            :aria-label="$t('Move down')"
                        >
                            ↓
                        </button>
                        <button
                            class="btn"
                            type="button"
                            data-act="drop"
                            :aria-label="$t('Drop')"
                        >
                            ⤓
                        </button>
                    </div>
                </div>
                <aside class="side">
                    <div class="stat">
                        <span>{{ $t('Score') }}</span><b id="sScore">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Lines') }}</span><b id="sLines">0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Level') }}</span><b id="sLevel">1</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Good eye contrast') }}</span
                        ><b id="sFc"></b>
                    </div>
                    <div class="next-box">
                        <span>{{ $t('Next piece') }}</span
                        ><canvas id="next"></canvas>
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
                        <kbd>←</kbd> <kbd>→</kbd> {{ $t('move') }} ·
                        <kbd>↑</kbd> {{ $t('rotate') }}<br />
                        <kbd>↓</kbd> {{ $t('move down') }} ·
                        <kbd>{{ $t('Space') }}</kbd> {{ $t('drop') }} ·
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
import start from '@/exercises/tetris';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'TetrisExercise',

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
.ex-tetris .board-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.ex-tetris .next-box {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.ex-tetris .next-box span {
    color: var(--muted);
    font-size: 0.9rem;
}

/* a stimulus (seen through the glasses): black in every theme, like the stage */
.ex-tetris .next-box canvas {
    background: #000;
    border-radius: 6px;
    display: block;
}

.ex-tetris .keys {
    font-size: 0.88rem;
    color: var(--muted);
    line-height: 1.9;
}

.ex-tetris .side .row .btn {
    flex: 1;
}

.ex-tetris .touch-pad {
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    user-select: none;
    -webkit-user-select: none;
}

.ex-tetris .touch-pad .btn {
    width: 64px;
    height: 56px;
    font-size: 1.4rem;
    padding: 0;
    touch-action: none;
}
</style>
