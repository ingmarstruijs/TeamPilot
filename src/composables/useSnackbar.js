import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
let timer = null

export function showSnackbar(msg, duration = 3000) {
  message.value = msg
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { visible.value = false }, duration)
}

export { message, visible }
