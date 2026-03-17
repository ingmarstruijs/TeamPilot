import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Returns a reactive boolean that tracks whether a CSS media query matches.
 * @param {string} query - e.g. '(min-width: 900px)'
 */
export function useMediaQuery(query) {
  const matches = ref(false)
  let mql = null

  function update(e) {
    matches.value = e.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    matches.value = mql.matches
    mql.addEventListener('change', update)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', update)
  })

  return matches
}
