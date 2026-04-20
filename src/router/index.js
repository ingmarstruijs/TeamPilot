import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Players from '@/views/Players.vue'
import LineupBuilder from '@/views/LineupBuilder.vue'
import Lineups from '@/views/Lineups.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/players', name: 'players', component: Players },
  { path: '/lineup/new', name: 'lineup-new', component: LineupBuilder },
  { path: '/lineup/:id', name: 'lineup-edit', component: LineupBuilder, props: true },
  { path: '/lineups', name: 'lineups', component: Lineups },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
