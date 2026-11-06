<template>
    <Head :title="$t('Exercises')" />

    <PageHeader
        :title="$t('Exercises')"
        :description="$t('Work 30–60 minutes a day, in rounds of 15–20 minutes with breaks. Wear your prescribed glasses under the red-cyan glasses.')"
    >
        <Link
            href="/calibrare"
            class="rounded-lg border border-line-2 px-3 py-2 text-sm text-fg no-underline hover:border-accent hover:text-accent"
        >
            {{ $t('Calibration') }}
        </Link>
        <Link
            href="/exercitii-fizice"
            class="rounded-lg border border-line-2 px-3 py-2 text-sm text-fg no-underline hover:border-accent hover:text-accent"
        >
            {{ $t('Physical exercises') }}
        </Link>
    </PageHeader>

    <ExerciseGrid :exercises="exercises" />
</template>

<script lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseGrid from '@/components/exercise/ExerciseGrid.vue';
import PageHeader from '@/components/general/PageHeader.vue';
import type { ExerciseMeta } from '@/types';

export default defineComponent({
    name: 'ExercisesIndex',

    components: { ExerciseGrid, Head, Link, PageHeader },

    props: {
        exercises: { type: Array as PropType<ExerciseMeta[]>, required: true },
    },
});
</script>
