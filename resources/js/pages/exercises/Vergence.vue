<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <main class="game-wrap ex-vergence">
            <div class="vg-stage-col">
                <div class="stage"><canvas id="cv"></canvas></div>
                <p id="limitHint" class="hint vg-under"></p>
            </div>
            <aside class="side">
                <div id="instr" class="instr"></div>
                <p id="calHint" class="hint" hidden></p>

                <div class="field vg-field">
                    <span class="label">{{ $t('Mode') }}</span>
                    <div id="segMode" class="seg">
                        <button type="button" data-mode="measure">
                            {{ $t('Measurement') }}
                        </button>
                        <button type="button" data-mode="train">
                            {{ $t('Training (jumps)') }}
                        </button>
                    </div>
                </div>
                <div id="durField" class="field vg-field" hidden>
                    <span class="label">{{ $t('Session length') }}</span>
                    <div id="segDur" class="seg"></div>
                </div>

                <button id="startBtn" class="btn primary big wide">
                    {{ $t('Start') }}
                </button>
                <p id="phaseText" class="q" aria-live="polite"></p>

                <div id="pMeasure" class="vg-panel">
                    <button
                        id="bMain"
                        type="button"
                        class="btn big wide"
                        disabled
                    >
                        {{ $t('I see one – start') }}
                    </button>
                    <button
                        id="bSupp"
                        type="button"
                        class="btn wide"
                        disabled
                    >
                        {{ $t('I see double even now') }}
                    </button>
                    <div class="stat">
                        <span>{{ $t('Demand now') }}</span><b id="sNow">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Convergence: doubled / single') }}</span
                        ><b id="sBo">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Divergence: doubled / single') }}</span
                        ><b id="sBi">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Last measurement') }}</span
                        ><b id="sPrev">–</b>
                    </div>
                </div>

                <div id="pTrain" class="vg-panel" hidden>
                    <div class="progress"><i id="prog"></i></div>
                    <div class="stat">
                        <span>{{ $t('Time left') }}</span><b id="sLeft">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Demand now') }}</span><b id="sNowT">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Joined / jumps') }}</span
                        ><b id="sOk">0 / 0</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Average time to join') }}</span
                        ><b id="sAvg">–</b>
                    </div>
                    <div class="stat">
                        <span>{{ $t('Highest demand joined') }}</span
                        ><b id="sMax">–</b>
                    </div>
                    <p class="q">{{ $t('Which way does the letter E point?') }}</p>
                    <div class="pad">
                        <button
                            id="bUp"
                            type="button"
                            class="btn resp vg-up"
                            :aria-label="$t('Up')"
                            disabled
                        >
                            ↑
                        </button>
                        <button
                            id="bLeft"
                            type="button"
                            class="btn resp vg-left"
                            :aria-label="$t('Left')"
                            disabled
                        >
                            ←
                        </button>
                        <button
                            id="bDown"
                            type="button"
                            class="btn resp vg-down"
                            :aria-label="$t('Down')"
                            disabled
                        >
                            ↓
                        </button>
                        <button
                            id="bRight"
                            type="button"
                            class="btn resp vg-right"
                            :aria-label="$t('Right')"
                            disabled
                        >
                            →
                        </button>
                    </div>
                    <button
                        id="bDouble"
                        type="button"
                        class="btn wide"
                        disabled
                    >
                        {{ $t('I see double (D)') }}
                    </button>
                </div>

                <div id="fb" class="feedback" aria-live="polite"></div>

                <label class="field vg-field">
                    <span class="label"
                        >{{ $t('Brightness of the good eye’s picture') }}:
                        <span id="balVal"></span
                    ></span>
                    <input
                        id="bal"
                        type="range"
                        min="40"
                        max="100"
                        step="5"
                    />
                    <span class="hint">{{
                        $t(
                            'If the lazy eye’s mark disappears, lower it a little.',
                        )
                    }}</span>
                </label>

                <p class="hint">
                    {{
                        $t(
                            'Stop if you get a headache, nausea or double vision that stays. At most 10 minutes.',
                        )
                    }}
                </p>
                <button id="infoBtn" type="button" class="btn ghost small">
                    {{ $t('Instructions and safety') }}
                </button>
            </aside>
        </main>
    </ExerciseShell>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseShell from '@/components/exercise/ExerciseShell.vue';
import start from '@/exercises/vergence';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'VergenceExercise',

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
.ex-vergence .vg-stage-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 100%;
}

.ex-vergence .vg-under {
    margin: 0;
}

.ex-vergence .vg-field {
    margin-bottom: 0;
}

.ex-vergence .vg-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.ex-vergence .vg-panel[hidden],
.ex-vergence .vg-field[hidden] {
    display: none;
}

.ex-vergence .stat span {
    font-size: 0.85rem;
}

.ex-vergence .pad .vg-up {
    grid-column: 2;
    grid-row: 1;
}

.ex-vergence .pad .vg-left {
    grid-column: 1;
    grid-row: 2;
}

.ex-vergence .pad .vg-down {
    grid-column: 2;
    grid-row: 2;
}

.ex-vergence .pad .vg-right {
    grid-column: 3;
    grid-row: 2;
}

.amb .vg-rules {
    margin: 0;
    padding-left: 1.2em;
}

.amb .vg-rules li + li {
    margin-top: 4px;
}

.amb .amb-modal .notice {
    margin: 0 0 0.8em;
}

.amb .amb-modal .notice p:last-child {
    margin-bottom: 0;
}

.amb .amb-modal .notice .check {
    margin-top: 8px;
    align-items: flex-start;
}
</style>
