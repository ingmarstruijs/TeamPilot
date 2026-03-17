<template>
  <Transition name="fade">
    <div v-if="visible" class="snackbar">{{ message }}</div>
  </Transition>
</template>

<script setup>
import { message, visible } from '@/composables/useSnackbar'
</script>
