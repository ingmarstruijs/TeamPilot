import { ref, watch } from 'vue'

const STORAGE_KEY = 'teampilot-drawer-collapsed'

const collapsed = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
)

watch(collapsed, (value) => {
  localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
})

export function useNavDrawer() {
  function toggleDrawer() {
    collapsed.value = !collapsed.value
  }

  return { collapsed, toggleDrawer }
}
