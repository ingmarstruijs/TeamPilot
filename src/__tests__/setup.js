import { beforeEach } from 'vitest'

// Clear localStorage before every test so store always starts from defaultState()
beforeEach(() => {
  localStorage.clear()
})
