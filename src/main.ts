import { createPinia } from 'pinia'
import { createApp } from 'vue'

import './assets/main.css'
import App from './App.vue'
import { createAppRouter } from './router'
import { redirectToLoginOnSessionExpiry } from './router/sessionExpiry'

const app = createApp(App)
const router = createAppRouter()

app.use(createPinia()).use(router)
redirectToLoginOnSessionExpiry(router)
app.mount('#app')
