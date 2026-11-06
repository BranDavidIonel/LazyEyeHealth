<template>
    <Head :title="$t('Settings')" />

    <PageHeader
        :title="$t('Settings')"
        :description="$t('Changes are saved in your account right away.')"
    />

    <div class="grid gap-4">
        <!-- Appearance -->
        <AppCard
            :title="$t('Appearance')"
            :description="
                $t(
                    'Colours of the pages. The exercise area stays black in every theme: the red-cyan glasses separate the two pictures properly only on black.',
                )
            "
        >
            <template #actions>
                <span
                    v-if="savedText('look')"
                    class="text-sm"
                    :class="saveState === 'saved' ? 'text-good' : 'text-muted'"
                    >{{ savedText('look') }}</span
                >
            </template>

            <div
                class="grid gap-3 sm:grid-cols-3"
                role="radiogroup"
                :aria-label="$t('Theme')"
            >
                <button
                    v-for="option in themeOptions"
                    :key="option.theme"
                    type="button"
                    role="radio"
                    :aria-checked="s.theme === option.theme"
                    class="rounded-xl border bg-panel p-3 text-left transition"
                    :class="
                        s.theme === option.theme
                            ? 'border-accent ring-2 ring-accent/30'
                            : 'border-line hover:border-line-2'
                    "
                    @click="setTheme(option.theme)"
                >
                    <!-- small picture of the theme, drawn with its own colours -->
                    <div
                        class="overflow-hidden rounded-lg border border-line bg-ink p-2"
                        :style="palettes[option.theme]"
                        aria-hidden="true"
                    >
                        <div
                            class="flex items-center gap-1.5 rounded-md border border-line bg-header px-2 py-1.5"
                        >
                            <span class="size-2.5 rounded-full bg-accent" />
                            <span class="h-1.5 w-10 rounded-full bg-fg/70" />
                            <span
                                class="ml-auto h-1.5 w-6 rounded-full bg-muted/50"
                            />
                        </div>
                        <div class="mt-2 grid grid-cols-3 gap-1.5">
                            <div
                                v-for="n in 2"
                                :key="n"
                                class="rounded-md border border-line bg-panel p-1.5"
                            >
                                <span
                                    class="block h-1.5 w-full rounded-full bg-fg/60"
                                />
                                <span
                                    class="mt-1 block h-1.5 w-2/3 rounded-full bg-muted/40"
                                />
                            </div>
                            <div class="rounded-md bg-accent p-1.5">
                                <span
                                    class="block h-1.5 w-full rounded-full bg-accent-ink/80"
                                />
                                <span
                                    class="mt-1 block h-1.5 w-1/2 rounded-full bg-accent-ink/50"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center gap-2">
                        <component
                            :is="option.icon"
                            class="size-4 text-muted"
                        />
                        <span class="font-medium">{{ $t(option.label) }}</span>
                        <Check
                            v-if="s.theme === option.theme"
                            class="ml-auto size-4 text-accent"
                        />
                    </div>
                    <p class="mt-1 text-sm text-muted">
                        {{ $t(option.note) }}
                    </p>
                </button>
            </div>

            <p class="mt-4 flex items-start gap-2 text-sm text-muted">
                <Languages class="mt-0.5 size-4 shrink-0" />
                {{
                    $t(
                        'The language (Română / English) is chosen with the button at the top right of the page.',
                    )
                }}
            </p>
        </AppCard>

        <!-- Eyes -->
        <AppCard :title="$t('Eyes')" :description="modeText">
            <template #actions>
                <span
                    v-if="savedText('eyes')"
                    class="text-sm"
                    :class="saveState === 'saved' ? 'text-good' : 'text-muted'"
                    >{{ savedText('eyes') }}</span
                >
            </template>

            <div class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div
                    v-for="seg in segments"
                    :key="seg.key"
                    class="transition"
                    :class="seg.glassesOnly && !anaglyph ? 'opacity-50' : ''"
                >
                    <span class="form-label">{{ seg.label }}</span>
                    <div
                        class="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-panel-2 p-1"
                        role="group"
                        :aria-label="seg.label"
                    >
                        <button
                            v-for="option in seg.options"
                            :key="option.value"
                            type="button"
                            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
                            :class="
                                s[seg.key] === option.value
                                    ? 'bg-accent text-accent-ink'
                                    : 'text-muted hover:text-fg'
                            "
                            :aria-pressed="s[seg.key] === option.value"
                            @click="choose(seg.key, option.value)"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>
            </div>

            <div
                class="mt-6 border-t border-line pt-5 transition"
                :class="anaglyph ? '' : 'opacity-50'"
            >
                <span class="form-label">{{
                    $t('Contrast for the good eye (games with both eyes)')
                }}</span>
                <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="flex size-9 items-center justify-center rounded-lg border border-line-2 text-lg text-fg hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                            :aria-label="$t('Lower contrast')"
                            :disabled="s.fellowContrast <= 0.1 + 1e-9"
                            @click="changeFellow(-0.05)"
                        >
                            −
                        </button>
                        <b
                            class="min-w-[3.5em] text-center text-lg tabular-nums"
                            >{{ fellowPct }}%</b
                        >
                        <button
                            type="button"
                            class="flex size-9 items-center justify-center rounded-lg border border-line-2 text-lg text-fg hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                            :aria-label="$t('Higher contrast')"
                            :disabled="s.fellowContrast >= 1 - 1e-9"
                            @click="changeFellow(0.05)"
                        >
                            +
                        </button>
                    </div>
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            v-model="autoBalance"
                            type="checkbox"
                            class="size-4 accent-accent"
                        />
                        {{ $t('Adjusted automatically after every game') }}
                    </label>
                </div>
                <p class="mt-2 max-w-3xl text-sm text-muted">
                    {{
                        $t(
                            'The lower it is, the fainter the good eye sees the game and the more the lazy eye has to work. Step 4 of the calibration finds the starting value.',
                        )
                    }}
                </p>
            </div>

            <p v-if="!anaglyph" class="mt-4 text-sm text-warn">
                {{
                    $t(
                        'With the patch the good eye stays covered, so the glasses settings and the contrast do not matter.',
                    )
                }}
            </p>
        </AppCard>

        <!-- Program -->
        <AppCard
            :title="$t('Program')"
            :description="$t('Daily goal, eye breaks and sounds.')"
        >
            <template #actions>
                <span
                    v-if="savedText('program')"
                    class="text-sm"
                    :class="saveState === 'saved' ? 'text-good' : 'text-muted'"
                    >{{ savedText('program') }}</span
                >
            </template>

            <div class="grid gap-x-6 gap-y-5 md:grid-cols-3">
                <div>
                    <label class="form-label" for="goal">{{
                        $t('Daily goal')
                    }}</label>
                    <select
                        id="goal"
                        v-model.number="dailyGoal"
                        class="form-control"
                    >
                        <option v-for="n in goalOptions" :key="n" :value="n">
                            {{ $t(':n min a day', { n }) }}
                        </option>
                    </select>
                    <p class="mt-1.5 text-xs text-muted">
                        {{
                            $t(
                                'It counts for the ring on the home page and for the reports.',
                            )
                        }}
                    </p>
                </div>
                <div>
                    <label class="form-label" for="breakEvery">{{
                        $t('Eye break')
                    }}</label>
                    <select
                        id="breakEvery"
                        v-model.number="breakEvery"
                        class="form-control"
                    >
                        <option v-for="n in breakOptions" :key="n" :value="n">
                            {{
                                n === 0
                                    ? $t('no reminder')
                                    : $t('every :n min', { n })
                            }}
                        </option>
                    </select>
                    <p class="mt-1.5 text-xs text-muted">
                        {{
                            $t(
                                'A window reminds you to look into the distance for 20 seconds.',
                            )
                        }}
                    </p>
                </div>
                <div>
                    <span class="form-label">{{ $t('Sounds') }}</span>
                    <label class="flex items-center gap-2 py-2 text-sm">
                        <input
                            v-model="sound"
                            type="checkbox"
                            class="size-4 accent-accent"
                        />
                        {{ $t('Sound for correct / wrong answers') }}
                    </label>
                </div>
            </div>
        </AppCard>

        <!-- Calibration -->
        <AppCard
            :title="$t('Calibration')"
            :description="
                $t(
                    'The glasses, the Worth fusion test, the balance between the eyes and the screen size.',
                )
            "
        >
            <template #actions>
                <Link
                    href="/calibrare"
                    class="rounded-lg px-3 py-1.5 text-sm font-semibold no-underline"
                    :class="
                        s.calibrated
                            ? 'border border-line-2 text-fg hover:border-accent hover:text-accent'
                            : 'bg-accent text-accent-ink hover:brightness-110'
                    "
                >
                    {{
                        s.calibrated
                            ? $t('Repeat the calibration')
                            : $t('Start the calibration')
                    }}
                </Link>
            </template>

            <dl class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg border border-line bg-panel-2 p-3">
                    <dt class="text-xs text-muted">{{ $t('Status') }}</dt>
                    <dd
                        class="mt-1 font-medium"
                        :class="s.calibrated ? 'text-good' : 'text-warn'"
                    >
                        {{
                            s.calibrated
                                ? $t('Calibration done')
                                : $t('Calibration not done yet')
                        }}
                    </dd>
                </div>
                <div class="rounded-lg border border-line bg-panel-2 p-3">
                    <dt class="text-xs text-muted">{{ $t('Screen size') }}</dt>
                    <dd
                        class="mt-1 font-medium"
                        :class="s.sizeCalibrated ? 'text-good' : 'text-warn'"
                    >
                        {{
                            s.sizeCalibrated
                                ? $t('Measured with a card')
                                : $t('Not measured: approximate value')
                        }}
                    </dd>
                    <dd class="mt-0.5 text-sm text-muted tabular-nums">
                        {{ pxPerMm }} px/mm
                    </dd>
                </div>
                <div class="rounded-lg border border-line bg-panel-2 p-3">
                    <dt class="text-xs text-muted">
                        {{ $t('Distance to the screen') }}
                    </dt>
                    <dd class="mt-1 font-medium tabular-nums">
                        {{ s.distanceCm }} cm
                    </dd>
                </div>
            </dl>
        </AppCard>

        <!-- Account -->
        <AppCard
            v-if="canChangePassword"
            :title="$t('Account')"
            :description="accountText"
        >
            <form class="grid max-w-md gap-4" @submit.prevent="changePassword">
                <div>
                    <label class="form-label" for="current_password">{{
                        $t('Current password')
                    }}</label>
                    <input
                        id="current_password"
                        v-model="passwordForm.current_password"
                        type="password"
                        autocomplete="current-password"
                        required
                        class="form-control"
                    />
                    <p v-if="errors.current_password" class="form-error">
                        {{ errors.current_password }}
                    </p>
                </div>
                <div>
                    <label class="form-label" for="password">{{
                        $t('New password')
                    }}</label>
                    <input
                        id="password"
                        v-model="passwordForm.password"
                        type="password"
                        autocomplete="new-password"
                        required
                        minlength="8"
                        class="form-control"
                    />
                    <p v-if="errors.password" class="form-error">
                        {{ errors.password }}
                    </p>
                    <p v-else class="mt-1.5 text-xs text-muted">
                        {{ $t('At least 8 characters.') }}
                    </p>
                </div>
                <div>
                    <label class="form-label" for="password_confirmation">{{
                        $t('Repeat the new password')
                    }}</label>
                    <input
                        id="password_confirmation"
                        v-model="passwordForm.password_confirmation"
                        type="password"
                        autocomplete="new-password"
                        required
                        class="form-control"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60"
                        :disabled="changingPassword"
                    >
                        {{ $t('Change the password') }}
                    </button>
                </div>
            </form>
        </AppCard>
    </div>
</template>

<script lang="ts">
import { Check, Droplet, Languages, Moon, Sun } from '@lucide/vue';
import { Head, Link, router } from '@inertiajs/vue3';
import type { Component } from 'vue';
import { defineComponent, markRaw } from 'vue';
import Amb from '@/amb';
import type { AmbSettings } from '@/amb';
import AppCard from '@/components/general/AppCard.vue';
import PageHeader from '@/components/general/PageHeader.vue';
import { t } from '@/i18n';
import { formatNumber } from '@/utils/format';
import { applyTheme, isTheme, THEME_LABELS, THEMES } from '@/utils/theme';
import type { Theme } from '@/utils/theme';

type Section = 'look' | 'eyes' | 'program';
type SegKey = 'lazyEye' | 'viewMode' | 'redSide' | 'otherLens';
type Segment = {
    key: SegKey;
    label: string;
    /** only matters with the red-cyan glasses */
    glassesOnly: boolean;
    options: { value: string; label: string }[];
};
type Palette = Record<string, string>;

/** Theme colours the small previews need. */
const PREVIEW_VARS = [
    '--color-ink',
    '--color-header',
    '--color-panel',
    '--color-panel-2',
    '--color-line',
    '--color-line-2',
    '--color-fg',
    '--color-muted',
    '--color-accent',
    '--color-accent-ink',
];

const THEME_NOTES: Record<Theme, string> = {
    light: 'White pages, easy to read in daylight.',
    blue: 'A soft light blue background, calmer on the eyes.',
    dark: 'Dark pages, like the exercises; less glare in the evening.',
};

const THEME_ICONS: Record<Theme, Component> = {
    light: markRaw(Sun),
    blue: markRaw(Droplet),
    dark: markRaw(Moon),
};

/**
 * Reads each theme's colours from the loaded stylesheets (app.css), so the
 * previews show every theme while one of them is active. The default
 * (light) values are on :root, the others on [data-theme='…'].
 */
function readPalettes(): Record<Theme, Palette> {
    const base: Palette = {};
    const own: Record<Theme, Palette> = { light: {}, blue: {}, dark: {} };

    const take = (rule: CSSStyleRule, into: Palette): void => {
        for (const name of PREVIEW_VARS) {
            const value = rule.style.getPropertyValue(name).trim();

            if (value) {
                into[name] = value;
            }
        }
    };

    const visit = (rules: CSSRuleList): void => {
        for (const rule of Array.from(rules)) {
            if (rule instanceof CSSStyleRule) {
                const match = rule.selectorText.match(
                    /\[data-theme=["']?([\w-]+)["']?\]/,
                );

                if (match && isTheme(match[1])) {
                    take(rule, own[match[1]]);
                } else if (!match && rule.selectorText.includes(':root')) {
                    take(rule, base);
                }
            }

            if ('cssRules' in rule) {
                visit((rule as CSSGroupingRule).cssRules);
            }
        }
    };

    for (const sheet of Array.from(document.styleSheets)) {
        try {
            visit(sheet.cssRules);
        } catch {
            // stylesheet from another origin: not readable
        }
    }

    return {
        light: { ...base, ...own.light },
        blue: { ...base, ...own.blue },
        dark: { ...base, ...own.dark },
    };
}

/** Settings: appearance, eyes and glasses, program, calibration, password. */
export default defineComponent({
    name: 'SettingsEdit',

    components: { AppCard, Check, Head, Languages, Link, PageHeader },

    props: {
        canChangePassword: { type: Boolean, default: false },
    },

    data() {
        return {
            palettes: { light: {}, blue: {}, dark: {} } as Record<
                Theme,
                Palette
            >,
            savedSection: '' as Section | '',
            saveState: '' as '' | 'saving' | 'saved',
            hideTimer: 0,
            changingPassword: false,
            passwordForm: {
                current_password: '',
                password: '',
                password_confirmation: '',
            },
        };
    },

    computed: {
        s(): AmbSettings {
            return Amb.settings();
        },

        anaglyph(): boolean {
            return this.s.viewMode === 'anaglyph';
        },

        modeText(): string {
            // reading the settings here makes the text follow every change
            void this.s.lazyEye;
            void this.s.viewMode;
            void this.s.otherLens;

            return Amb.modeText();
        },

        themeOptions(): {
            theme: Theme;
            label: string;
            note: string;
            icon: Component;
        }[] {
            return THEMES.map((theme) => ({
                theme,
                label: THEME_LABELS[theme],
                note: THEME_NOTES[theme],
                icon: THEME_ICONS[theme],
            }));
        },

        segments(): Segment[] {
            const cap = (text: string): string =>
                text.charAt(0).toUpperCase() + text.slice(1);
            const eyes = [
                { value: 'left', label: cap(Amb.EYE.left) },
                { value: 'right', label: cap(Amb.EYE.right) },
            ];

            return [
                {
                    key: 'lazyEye',
                    label: t('Lazy eye (the weak one)'),
                    glassesOnly: false,
                    options: eyes,
                },
                {
                    key: 'viewMode',
                    label: t('How you work'),
                    glassesOnly: false,
                    options: [
                        { value: 'anaglyph', label: t('Red-cyan glasses') },
                        { value: 'patch', label: t('Patch on the good eye') },
                    ],
                },
                {
                    key: 'redSide',
                    label: t('Eye with the red lens'),
                    glassesOnly: true,
                    options: eyes,
                },
                {
                    key: 'otherLens',
                    label: t('Other lens'),
                    glassesOnly: true,
                    options: (['cyan', 'blue', 'green'] as const).map(
                        (lens) => ({ value: lens, label: cap(Amb.LENS[lens]) }),
                    ),
                },
            ];
        },

        fellowPct(): number {
            return Math.round(this.s.fellowContrast * 100);
        },

        autoBalance: {
            get(): boolean {
                return this.s.autoBalance;
            },
            set(value: boolean): void {
                this.save({ autoBalance: value }, 'eyes');
            },
        },

        dailyGoal: {
            get(): number {
                return this.s.dailyGoalMin;
            },
            set(value: number): void {
                this.save({ dailyGoalMin: value }, 'program');
            },
        },

        breakEvery: {
            get(): number {
                return this.s.breakEveryMin;
            },
            set(value: number): void {
                this.save({ breakEveryMin: value }, 'program');
            },
        },

        sound: {
            get(): boolean {
                return this.s.sound;
            },
            set(value: boolean): void {
                this.save({ sound: value }, 'program');
            },
        },

        goalOptions(): number[] {
            const list = [15, 20, 30, 45, 60];

            if (!list.includes(this.s.dailyGoalMin)) {
                list.push(this.s.dailyGoalMin);
            }

            return list.sort((a, b) => a - b);
        },

        breakOptions(): number[] {
            const list = [15, 20, 30];
            const current = this.s.breakEveryMin;

            if (current > 0 && !list.includes(current)) {
                list.push(current);
            }

            return [...list.sort((a, b) => a - b), 0];
        },

        pxPerMm(): string {
            return formatNumber(this.s.pxPerMm, 2);
        },

        accountText(): string {
            const email = this.$page.props.auth.user?.email;

            return email ? t('Signed in as :email', { email }) : '';
        },

        errors(): Record<string, string> {
            return (this.$page.props.errors ?? {}) as Record<string, string>;
        },
    },

    created() {
        Amb.initSettings(this.$page.props.settings);
    },

    mounted() {
        this.palettes = readPalettes();
    },

    beforeUnmount() {
        window.clearTimeout(this.hideTimer);
    },

    methods: {
        /** Saves a change (Amb.set debounces and sends it) and shows "Saving… / Saved". */
        save(patch: Partial<AmbSettings>, section: Section): void {
            Amb.set(patch);
            this.saved(section);
        },

        saved(section: Section): void {
            this.savedSection = section;
            this.saveState = 'saving';
            window.clearTimeout(this.hideTimer);
            // send now instead of waiting for the debounce, so "Saved" is shown after the answer
            void Amb.flushSettings().then(() => {
                if (this.savedSection !== section) {
                    return;
                }

                this.saveState = 'saved';
                window.clearTimeout(this.hideTimer);
                this.hideTimer = window.setTimeout(() => {
                    this.saveState = '';
                }, 2500);
            });
        },

        savedText(section: Section): string {
            if (this.savedSection !== section || !this.saveState) {
                return '';
            }

            return this.saveState === 'saved' ? t('Saved ✓') : t('Saving…');
        },

        setTheme(theme: Theme): void {
            applyTheme(theme);
            this.save({ theme }, 'look');
        },

        choose(key: SegKey, value: string): void {
            this.save({ [key]: value } as Partial<AmbSettings>, 'eyes');
        },

        changeFellow(delta: number): void {
            Amb.adjustFellow(delta, 'manual');
            this.saved('eyes');
        },

        changePassword(): void {
            this.changingPassword = true;
            router.put('/setari/parola', { ...this.passwordForm }, {
                preserveScroll: true,
                onSuccess: () => {
                    this.passwordForm = {
                        current_password: '',
                        password: '',
                        password_confirmation: '',
                    };
                },
                onFinish: () => {
                    this.changingPassword = false;
                },
            });
        },
    },
});
</script>
