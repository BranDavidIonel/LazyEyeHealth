<template>
    <div class="space-y-8">
        <section v-for="group in groups" :key="group.key">
            <div class="mb-1 flex flex-wrap items-center gap-2.5">
                <h2 class="text-lg font-semibold">{{ $t(group.title) }}</h2>
                <span :class="group.tagClass">{{ $t(group.tag) }}</span>
            </div>
            <p class="mb-4 max-w-3xl text-sm text-muted">
                {{ $t(group.text) }}
            </p>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                    v-for="item in group.items"
                    :key="item.slug"
                    :href="url(item.slug)"
                    class="panel group flex flex-col gap-2.5 p-4 text-fg no-underline transition hover:-translate-y-0.5 hover:border-accent"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-black"
                        >
                            <ExerciseIcon :slug="item.slug" />
                        </div>
                        <div class="min-w-0">
                            <h3 class="font-semibold group-hover:text-accent">
                                {{ item.title }}
                            </h3>
                            <p class="text-xs text-muted">{{ item.minutes }}</p>
                        </div>
                    </div>
                    <p class="text-sm text-muted">{{ item.description }}</p>
                    <p class="text-xs">
                        <span class="text-muted">{{ $t('Trains:') }}</span>
                        {{ item.trains }}
                    </p>
                    <p
                        v-if="summaries"
                        class="mt-auto border-t border-line pt-2 text-xs text-muted"
                    >
                        {{ statLine(item.slug) }}
                    </p>
                </Link>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import { Link } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseIcon from '@/components/exercise/ExerciseIcon.vue';
import type { ExerciseMeta } from '@/types';
import { exerciseStatLine } from '@/utils/exerciseStats';
import type { ExerciseSummary } from '@/utils/exerciseStats';

type Group = {
    key: string;
    title: string;
    tag: string;
    tagClass: string;
    text: string;
    items: ExerciseMeta[];
};

/** Exercise cards grouped by kind (games with both eyes, relief, precision, strabismus). */
export default defineComponent({
    name: 'ExerciseGrid',

    components: { ExerciseIcon, Link },

    props: {
        exercises: { type: Array as PropType<ExerciseMeta[]>, required: true },
        summaries: {
            type: Object as PropType<Record<string, ExerciseSummary> | null>,
            default: null,
        },
    },

    computed: {
        groups(): Group[] {
            const of = (group: string): ExerciseMeta[] =>
                this.exercises.filter((e) => e.group === group);

            return [
                {
                    key: 'dichoptic',
                    title: 'Games with both eyes',
                    tag: 'red-cyan glasses',
                    tagClass: 'tag-di',
                    text: 'Dichoptic games: each eye sees other pieces, so you can only play when the eyes work together. The good eye gets a lower contrast so it no longer "covers" the lazy eye, and the contrast goes up as you progress.',
                    items: of('dichoptic'),
                },
                {
                    key: 'mono',
                    title: 'Precision exercises',
                    tag: 'lazy eye only',
                    tagClass: 'tag-mono',
                    text: 'Perceptual learning: fine tasks repeated at the limit of what the lazy eye sees. The difficulty adapts by itself, so you always work right at the threshold.',
                    items: of('mono'),
                },
                {
                    key: 'stereo',
                    title: 'Depth vision',
                    tag: 'red-cyan glasses',
                    tagClass: 'tag-di',
                    text: 'Training the brain to combine the two pictures into one with depth.',
                    items: of('stereo'),
                },
                {
                    key: 'vergence',
                    title: 'Strabismus and convergence',
                    tag: 'eyes together',
                    tagClass: 'tag-stereo',
                    text: 'For the eye that drifts outward: the eyes learn to turn in together and stay aligned. Ask your eye doctor before fusion exercises.',
                    items: of('vergence'),
                },
            ].filter((g) => g.items.length);
        },
    },

    methods: {
        url(slug: string): string {
            return slug === 'fara-ecran' ? '/exercitii-fizice' : `/exercitii/${slug}`;
        },

        statLine(slug: string): string {
            return exerciseStatLine(slug, this.summaries?.[slug]);
        },
    },
});
</script>
