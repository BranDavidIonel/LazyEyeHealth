<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-calibration">
            <p class="hint">
                {{
                    $t(
                        'Do the calibration once, in the light you usually exercise in. You can repeat it at any time. The settings are saved right away.',
                    )
                }}
            </p>
            <div class="steps">
                <section id="step1" class="card">
                    <span class="step-no">{{ $t('Step :n', { n: 1 }) }}</span>
                    <h2>{{ $t('Eyes and glasses') }}</h2>
                    <div class="opts">
                        <div class="field">
                            <span class="label">{{
                                $t('Lazy eye (the weak one)')
                            }}</span>
                            <div id="segLazy" class="seg"></div>
                        </div>
                        <div class="field">
                            <span class="label">{{ $t('How you work') }}</span>
                            <div id="segMode" class="seg"></div>
                        </div>
                        <div class="field anag">
                            <span class="label">{{
                                $t('Eye with the red lens')
                            }}</span>
                            <div id="segRed" class="seg"></div>
                        </div>
                        <div class="field anag">
                            <span class="label">{{ $t('Other lens') }}</span>
                            <div id="segLens" class="seg"></div>
                        </div>
                    </div>
                    <p id="summary1"></p>
                    <p class="hint anag">
                        {{
                            $t(
                                'Tip: the cyan lens lets through more light than the red one, so the eye behind it sees brighter. If the lazy eye barely sees the pieces in the games, you can turn the glasses around (cyan lens on the lazy eye) and change the setting “Eye with the red lens” here.',
                            )
                        }}
                    </p>
                    <p id="patchTip" class="hint">
                        {{
                            $t(
                                'With the patch, the good eye stays covered and steps 2–4 are not needed (they matter only for red-cyan glasses).',
                            )
                        }}
                    </p>
                </section>

                <section id="step2" class="card">
                    <span class="step-no">{{ $t('Step :n', { n: 2 }) }}</span>
                    <h2>{{ $t('Colour test') }}</h2>
                    <p class="notice patch-note" hidden>
                        {{
                            $t(
                                'This step matters only for red-cyan glasses. In patch mode you can skip it.',
                            )
                        }}
                    </p>
                    <p id="colorInstr"></p>
                    <div class="cal-canvas">
                        <div class="stage"><canvas id="cColors"></canvas></div>
                    </div>
                    <div class="sliders">
                        <label class="field">
                            <span class="label"
                                >{{ $t('Red brightness') }}:
                                <span id="redVal" class="val"></span
                            ></span>
                            <input
                                id="redLevel"
                                type="range"
                                min="80"
                                max="255"
                                step="1"
                            />
                        </label>
                        <label class="field">
                            <span id="otherLabel" class="label"></span>
                            <input
                                id="otherLevel"
                                type="range"
                                min="80"
                                max="255"
                                step="1"
                            />
                        </label>
                    </div>
                </section>

                <section id="step3" class="card">
                    <span class="step-no">{{ $t('Step :n', { n: 3 }) }}</span>
                    <h2>{{ $t('Fusion test (Worth 4 dots)') }}</h2>
                    <p class="notice patch-note" hidden>
                        {{
                            $t(
                                'This step matters only for red-cyan glasses. In patch mode you can skip it.',
                            )
                        }}
                    </p>
                    <p>
                        {{
                            $t(
                                'With the glasses on and both eyes open, look at the centre of the drawing for a few seconds. How many dots do you see?',
                            )
                        }}
                    </p>
                    <div class="cal-canvas">
                        <div class="stage"><canvas id="cWorth"></canvas></div>
                    </div>
                    <div id="worthBtns" class="row worth-btns">
                        <button
                            v-for="n in [2, 3, 4, 5]"
                            :key="n"
                            class="btn"
                            type="button"
                            :data-seen="n"
                        >
                            {{ $t('I see :n', { n }) }}
                        </button>
                        <button class="btn" type="button" data-seen="alt">
                            {{ $t('They alternate') }}
                        </button>
                    </div>
                    <div id="worthOut" class="instr worth-out"></div>
                </section>

                <section id="step4" class="card">
                    <span class="step-no">{{ $t('Step :n', { n: 4 }) }}</span>
                    <h2>{{ $t('Balance between the eyes') }}</h2>
                    <p class="notice patch-note" hidden>
                        {{
                            $t(
                                'This step matters only for red-cyan glasses. In patch mode you can skip it.',
                            )
                        }}
                    </p>
                    <p id="balanceInstr"></p>
                    <div class="cal-canvas">
                        <div class="stage"><canvas id="cBalance"></canvas></div>
                    </div>
                    <label class="field">
                        <span class="label"
                            >{{ $t('Contrast for the good eye') }}:
                            <span id="balVal" class="val"></span
                        ></span>
                        <input
                            id="balance"
                            type="range"
                            min="5"
                            max="100"
                            step="5"
                        />
                    </label>
                    <div class="row">
                        <button
                            id="saveBalance"
                            class="btn primary"
                            type="button"
                        >
                            {{ $t('Save the balance') }}
                        </button>
                        <span class="hint"
                            >{{ $t('Current value in the games') }}:
                            <b id="balCurrent" class="val"></b
                        ></span>
                        <span id="balSaved" class="saved"></span>
                    </div>
                </section>

                <section id="step5" class="card">
                    <span class="step-no">{{ $t('Step :n', { n: 5 }) }}</span>
                    <h2>{{ $t('Screen size and distance') }}</h2>
                    <p>
                        {{
                            $t(
                                'Hold a bank card or an ID card against the screen (they have the standard width of 85.6 mm) and match the width of the rectangle to the card. Do not press hard on the screen.',
                            )
                        }}
                    </p>
                    <div class="rect-box">
                        <div id="cardRect" class="card-rect">
                            {{ $t('85.6 × 54 mm') }}
                        </div>
                    </div>
                    <div class="row ppm-row">
                        <button
                            id="ppmMinus"
                            class="btn small"
                            type="button"
                            :aria-label="$t('Smaller')"
                        >
                            −
                        </button>
                        <input
                            id="ppm"
                            type="range"
                            min="2"
                            max="8"
                            step="0.01"
                            :aria-label="$t('Pixels per millimetre')"
                        />
                        <button
                            id="ppmPlus"
                            class="btn small"
                            type="button"
                            :aria-label="$t('Larger')"
                        >
                            +
                        </button>
                        <span class="hint"
                            ><span id="ppmVal" class="val"></span> px/mm</span
                        >
                    </div>
                    <div class="field dist-field">
                        <label class="label" for="dist">{{
                            $t('Distance from the eyes to the screen (cm)')
                        }}</label>
                        <div class="row">
                            <input
                                id="dist"
                                type="number"
                                min="30"
                                max="300"
                                step="1"
                            />
                        </div>
                        <span class="hint">{{
                            $t(
                                'The precision exercises compute visual acuity from this distance, so keep it the same when you exercise.',
                            )
                        }}</span>
                    </div>
                    <div class="row">
                        <button id="saveSize" class="btn primary" type="button">
                            {{ $t('Save size and distance') }}
                        </button>
                        <span id="sizeSaved" class="saved"></span>
                    </div>
                </section>

                <div class="finish">
                    <button id="finish" class="btn primary big" type="button">
                        {{ $t('Done, go to the menu') }}
                    </button>
                </div>
            </div>
        </div>
    </ExerciseShell>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseShell from '@/components/exercise/ExerciseShell.vue';
import start from '@/exercises/calibration';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'CalibrationExercise',

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
.ex-calibration {
    max-width: 1120px;
    margin: 0 auto;
    padding: 28px 16px 72px;
}

.ex-calibration .steps {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.ex-calibration .step-no {
    display: block;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 4px;
}

.ex-calibration .opts {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    margin: 12px 0;
}

.ex-calibration .opts .field {
    margin: 0;
}

.ex-calibration .sliders {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.ex-calibration .cal-canvas {
    text-align: center;
    margin: 14px 0;
}

.ex-calibration .cal-canvas .stage {
    display: inline-block;
}

.ex-calibration .val {
    color: var(--text);
    font-variant-numeric: tabular-nums;
}

.ex-calibration .worth-btns {
    justify-content: center;
    margin-top: 4px;
}

.ex-calibration .worth-btns .btn[aria-pressed='true'] {
    border-color: var(--accent);
    color: var(--accent);
}

.ex-calibration .worth-out {
    margin-top: 14px;
}

.ex-calibration .worth-out:empty {
    display: none;
}

.ex-calibration .rect-box {
    overflow-x: auto;
    padding: 10px 0;
    margin: 12px 0;
}

.ex-calibration .card-rect {
    border: 2px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    font-weight: 600;
    font-size: 0.9rem;
}

.ex-calibration .ppm-row input[type='range'] {
    flex: 1;
    min-width: 160px;
    width: auto;
}

.ex-calibration .dist-field {
    margin-top: 16px;
}

.ex-calibration #dist {
    width: 110px;
}

.ex-calibration .saved {
    color: var(--good);
    font-weight: 600;
}

.ex-calibration .saved:empty {
    display: none;
}

.ex-calibration .finish {
    text-align: center;
    margin-top: 8px;
}

.ex-calibration .notice {
    margin: 10px 0;
}

@media (max-width: 720px) {
    .ex-calibration {
        padding-top: 18px;
    }
}
</style>
