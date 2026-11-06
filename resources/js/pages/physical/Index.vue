<template>
    <Head :title="$t('Physical exercises')" />

    <PageHeader
        :title="$t('Physical exercises (no screen)')"
        :description="$t('Exercises you can do at home without a screen, for the lazy eye and for the eye that drifts outwards: what they are for, how to do them, what the studies say and when to stop.')"
    >
        <Link
            href="/exercitii/convergenta"
            class="rounded-lg border border-line-2 px-3 py-2 text-sm text-fg no-underline hover:border-accent hover:text-accent"
        >
            {{ $t('Convergence training on screen') }}
        </Link>
    </PageHeader>

    <section
        class="mb-6 rounded-xl border border-warn/50 bg-warn/10 p-4 sm:p-5"
        aria-labelledby="pf-safety"
    >
        <h2 id="pf-safety" class="flex items-center gap-2 font-semibold">
            <TriangleAlert class="size-5 shrink-0 text-warn" aria-hidden="true" />
            {{ $t('Read this first') }}
        </h2>
        <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            <li v-for="(s, i) in SAFETY" :key="i">{{ tx(s) }}</li>
        </ul>
        <p class="mt-3 text-sm text-muted">
            {{ $t('Your settings: lazy eye :lazy, good eye :good.', { lazy: lazyName, good: goodName }) }}
            <Link href="/setari">{{ $t('Change') }}</Link>
        </p>
    </section>

    <nav class="mb-6" :aria-label="$t('Exercises on this page')">
        <ul class="flex flex-wrap gap-2">
            <li v-for="(g, i) in GUIDE" :key="g.key">
                <a
                    :href="`#${g.key}`"
                    class="inline-block rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-fg no-underline hover:border-accent hover:text-accent"
                >
                    {{ i + 1 }}. {{ tx(g.title) }}
                </a>
            </li>
        </ul>
    </nav>

    <div class="space-y-6">
        <GuideCard v-for="(g, i) in GUIDE" :key="g.key" :item="g" :number="i + 1">
            <NpcTracker v-if="g.key === 'pencil'" />
            <BarrelCard v-if="g.key === 'barrel'" />
            <p
                v-if="g.key === 'patching'"
                class="rounded-lg border border-line bg-panel-2 px-3.5 py-3 text-sm"
            >
                {{ $t('Patching minutes are logged in the daily journal on the Home page; the timer here only helps you keep track.') }}
                <Link href="/">{{ $t('Open the journal') }}</Link>
            </p>
        </GuideCard>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <section class="panel p-4 sm:p-5" aria-labelledby="pf-no-evidence">
            <h2 id="pf-no-evidence" class="flex items-center gap-2 font-semibold">
                <CircleSlash class="size-5 shrink-0 text-muted" aria-hidden="true" />
                {{ $t('What has no evidence') }}
            </h2>
            <p class="mt-2 text-[0.95rem] leading-relaxed">{{ tx(NO_EVIDENCE) }}</p>
        </section>

        <section class="panel p-4 sm:p-5" aria-labelledby="pf-doctor">
            <h2 id="pf-doctor" class="flex items-center gap-2 font-semibold">
                <Stethoscope class="size-5 shrink-0 text-bad" aria-hidden="true" />
                {{ $t('When to see the doctor') }}
            </h2>
            <ul class="mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem]">
                <li v-for="(s, i) in SEE_DOCTOR" :key="i">{{ tx(s) }}</li>
            </ul>
        </section>
    </div>

    <section class="panel mt-6 p-4 sm:p-5" aria-labelledby="pf-sources">
        <h2 id="pf-sources" class="font-semibold">{{ $t('Sources') }}</h2>
        <ul class="mt-2 space-y-2 text-sm">
            <li v-for="s in SOURCES" :key="s.url" class="break-words">
                <a :href="s.url" target="_blank" rel="noopener noreferrer">{{ tx(s.title) }}</a>
            </li>
        </ul>
        <p class="mt-3 text-xs text-muted">
            {{ $t('This page is general information, not medical advice. Your eye doctor or orthoptist knows your eyes and decides what is right for you.') }}
        </p>
    </section>
</template>

<script lang="ts">
import { CircleSlash, Stethoscope, TriangleAlert } from '@lucide/vue';
import { Head, Link } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import PageHeader from '@/components/general/PageHeader.vue';
import BarrelCard from '@/components/physical/BarrelCard.vue';
import GuideCard from '@/components/physical/GuideCard.vue';
import { GUIDE, NO_EVIDENCE, SAFETY, SEE_DOCTOR, SOURCES, tx } from '@/components/physical/guide';
import NpcTracker from '@/components/physical/NpcTracker.vue';
import { stopTimer } from '@/components/physical/timer';
import type { ExerciseMeta, ResultMap } from '@/types';

/** "Physical exercises": illustrated guide of off-screen exercises, timers and the near point of convergence. */
export default defineComponent({
    name: 'PhysicalExercisesPage',

    components: {
        BarrelCard,
        CircleSlash,
        GuideCard,
        Head,
        Link,
        NpcTracker,
        PageHeader,
        Stethoscope,
        TriangleAlert,
    },

    props: {
        exercise: { type: Object as PropType<ExerciseMeta>, required: true },
        results: { type: Object as PropType<ResultMap>, default: () => ({}) },
    },

    setup() {
        return { GUIDE, NO_EVIDENCE, SAFETY, SEE_DOCTOR, SOURCES };
    },

    computed: {
        lazyName(): string {
            return Amb.EYE[Amb.settings().lazyEye];
        },

        goodName(): string {
            return Amb.EYE[Amb.goodEye()];
        },
    },

    created() {
        Amb.initSettings(this.$page.props.settings);
        Amb.seedResults(this.results);
    },

    beforeUnmount() {
        stopTimer();
    },

    methods: {
        tx,
    },
});
</script>
