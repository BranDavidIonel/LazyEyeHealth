<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-reading">
            <main class="game-wrap">
                <div id="readStage" class="read-stage">
                    <p id="readText" class="read-text" hidden></p>
                    <p id="readNote" class="read-note"></p>
                </div>
                <aside class="side">
                    <div id="instr" class="instr"></div>
                    <p id="calHint" class="hint" hidden></p>
                    <button id="mainBtn" class="btn primary big wide">
                        {{ $t('Start') }}
                    </button>
                    <div id="rateBox" class="rate" hidden>
                        <p class="q">{{ $t('How was this text?') }}</p>
                        <button id="rEasy" class="btn wide">
                            <kbd>1</kbd> {{ $t('Easy') }}
                        </button>
                        <button id="rEffort" class="btn wide">
                            <kbd>2</kbd> {{ $t('With effort') }}
                        </button>
                        <button id="rFail" class="btn wide">
                            <kbd>3</kbd> {{ $t('Could not read it') }}
                        </button>
                    </div>
                    <div class="progress"><i id="prog"></i></div>
                    <div class="stat">
                        <span>{{ $t('Text') }}</span><b id="sText">1 / 5</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Print size') }}</span><b id="sSize">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Last speed') }}</span><b id="sSpeed">–</b>
                    </div>
                    <ol id="hist" class="hist" hidden></ol>
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
import start from '@/exercises/reading';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'ReadingExercise',

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
/* .btn and .rate set a display, so the hidden attribute needs help */
.ex-reading [hidden] {
    display: none !important;
}

/* The stage is part of the stimulus: black (glasses) or white (patch), set by
   exercises/reading.ts from Amb.monoColors(), the same in every theme. */
.ex-reading .read-stage {
    flex: 1 1 560px;
    max-width: 960px;
    min-width: 0;
    min-height: 340px;
    padding: 28px 24px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: #000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
}

.ex-reading .read-text {
    margin: 0;
    width: 100%;
    max-width: 38em;
    line-height: normal;
    text-align: left;
    overflow-wrap: break-word;
    hyphens: none;
}

.ex-reading .read-note {
    margin: auto 0;
    align-self: center;
    text-align: center;
    font-size: 1rem;
}

.ex-reading .rate {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.ex-reading .rate .btn {
    justify-content: flex-start;
}

.ex-reading .hist {
    margin: 0;
    padding: 8px 12px 8px 12px;
    list-style: none;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    font-size: 0.85rem;
    color: var(--muted);
}

.ex-reading .hist li + li {
    margin-top: 2px;
}

.ex-reading .hist .r-easy {
    color: var(--good);
}

.ex-reading .hist .r-failed {
    color: var(--bad);
}
</style>
