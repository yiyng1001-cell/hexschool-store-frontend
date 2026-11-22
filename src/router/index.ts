import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/home/HomeView.vue'
import CartView from '@/views/cart/CartView.vue'
import ProductDetailView from '@/views/productDetail/ProductDetailView.vue'
import ProductListView from '@/views/productList/ProductListView.vue'
import LoginView from '@/views/login/LoginView.vue'
import RegisterView from '@/views/register/RegisterView.vue'

import { authNavigationGuard } from './authGuards'

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/products', name: 'products', component: ProductListView },
      { path: '/products/:id', name: 'productDetail', component: ProductDetailView },
      { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true } },
      { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
      { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
    ],
  })
  router.beforeEach(authNavigationGuard)
  return router
}
