import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Spelers from '@/views/Spelers.vue'
import OpstellingBuilder from '@/views/OpstellingBuilder.vue'
import Opstellingen from '@/views/Opstellingen.vue'
import ShareView from '@/views/ShareView.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/spelers', name: 'spelers', component: Spelers },
  { path: '/opstelling/nieuw', name: 'opstelling-nieuw', component: OpstellingBuilder },
  { path: '/opstelling/:id', name: 'opstelling-bewerk', component: OpstellingBuilder, props: true },
  { path: '/opstellingen', name: 'opstellingen', component: Opstellingen },
  { path: '/share', name: 'share', component: ShareView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
