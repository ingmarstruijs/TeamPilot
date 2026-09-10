<template>
  <div class="lang-switch" role="group" :aria-label="t('common.language')">
    <button
      v-for="lang in SUPPORTED_LOCALES"
      :key="lang.id"
      type="button"
      class="lang-btn md-label-sm"
      :class="{ active: locale === lang.id }"
      :aria-pressed="locale === lang.id"
      @click="setLocale(lang.id)"
    >
      {{ lang.nativeLabel }}
    </button>
  </div>
</template>

<script setup>
import { t, locale, setLocale, SUPPORTED_LOCALES } from '@/i18n'
</script>

<style scoped>
.lang-switch {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 8px;
  background: var(--md-surface-variant);
  border: 1px solid var(--md-outline-variant);
  flex-shrink: 0;
}

.lang-btn {
  min-width: 36px;
  min-height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.lang-btn.active {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}
</style>
