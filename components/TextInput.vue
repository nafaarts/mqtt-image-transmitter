<script setup lang="ts">

defineProps({
    label: String,
    placeholder: String,
    required: Boolean,
    type: {
        type: String,
        default: 'text'
    },
    modelValue: {
        type: String,
        default: ''
    }
})

defineEmits(['update:modelValue'])

</script>

<template>
    <div>
        <label class="block mb-2 text-sm font-medium text-zinc-900 dark:text-white">
            {{ label }}
            <small v-show="required" class="text-red-800">*</small>
        </label>
        <input :type="type" v-on:input="$emit('update:modelValue', $event.target.value)" :value="modelValue"
            :placeholder="placeholder" :required="required"
            class="bg-zinc-50 border border-zinc-300 text-zinc-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
    </div>
</template> 