import { createPinia } from 'pinia'
import { createApp } from 'vue'

import './assets/main.css'
import App from './App.vue'
import { setSlowRequestsListener } from './api/apiClient'
import { createAppRouter } from './router'
import { redirectToLoginOnSessionExpiry } from './router/sessionExpiry'
import { useConnectionStore } from './stores/connectionStore'

const app = createApp(App)
const router = createAppRouter()

app.use(createPinia()).use(router)
redirectToLoginOnSessionExpiry(router)
setSlowRequestsListener((hasSlowRequests) => useConnectionStore().setBackendSlow(hasSlowRequests))
app.mount('#app')
