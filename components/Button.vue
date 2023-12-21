<script setup lang="ts">
defineProps({
    label: {
        type: String,
        required: true
    },
})
</script>

<template>
    <button
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 disabled:opacity-75">
        {{ label }}
    </button>
</template>