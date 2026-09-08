import { computed, ref } from 'vue'
import en from './en.js'
import nl from './nl.js'

export const LOCALE_STORAGE_KEY = 'teampilot-locale'
export const SUPPORTED_LOCALES = [
  { id: 'nl', nativeLabel: 'NL' },
  { id: 'en', nativeLabel: 'EN' },
]

const messages = { nl, en }

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && messages[stored]) return stored
  } catch {
    /* ignore */
  }
  return 'nl'
}

export const locale = ref(readStoredLocale())

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
}

export function t(key, params) {
  const str = lookup(messages[locale.value], key) ?? lookup(messages.nl, key) ?? key
  if (!params) return String(str)
  return String(str).replace(/\{(\w+)\}/g, (_, name) => (
    params[name] == null ? '' : String(params[name])
  ))
}

function syncDocumentLang(code) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = code
}

export function setLocale(next) {
  if (!messages[next]) return
  locale.value = next
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
  syncDocumentLang(next)
}

export function resetLocale() {
  locale.value = 'nl'
  try {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  syncDocumentLang('nl')
}

syncDocumentLang(locale.value)

export function useI18n() {
  return {
    locale: computed(() => locale.value),
    t,
    setLocale,
  }
}
