import { beforeEach } from 'vitest'
import { resetLocale } from '@/i18n'

// Clear localStorage before every test so store always starts from defaultState()
beforeEach(() => {
  localStorage.clear()
  resetLocale()
})
