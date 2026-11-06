<template>
    <div>
        <h1 class="text-2xl font-semibold">Acasă</h1>
        <p class="text-muted">În lucru.</p>
        <Link href="/exercitii/vernier">Linii aliniate</Link>
    </div>
</template>

<script lang="ts">
import { Link } from '@inertiajs/vue3';
import { defineComponent } from 'vue';

export default defineComponent({ name: 'DashboardPage', components: { Link } });
</script>
