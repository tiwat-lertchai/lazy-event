import { createRouter, createWebHistory } from 'vue-router'
import UploadView from '../views/UploadView.vue'
import QueueStatusView from '../views/QueueStatusView.vue'
import AdminQueueView from '../views/AdminQueueView.vue'
import AdviceBoardView from '../views/AdviceBoardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'upload', component: UploadView },
    { path: '/queue', name: 'queue', component: QueueStatusView },
    { path: '/admin', name: 'admin', component: AdminQueueView },
    { path: '/board', name: 'board', component: AdviceBoardView },
  ],
})

export default router
