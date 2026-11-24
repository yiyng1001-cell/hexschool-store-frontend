import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/home/HomeView.vue'
import CartView from '@/views/cart/CartView.vue'
import ProductDetailView from '@/views/productDetail/ProductDetailView.vue'
import ProductListView from '@/views/productList/ProductListView.vue'
import LoginView from '@/views/login/LoginView.vue'
import NotFoundView from '@/views/notFound/NotFoundView.vue'
import RegisterView from '@/views/register/RegisterView.vue'

import { buildPageTitle } from '@/lib/pageTitle'

import { authNavigationGuard } from './authGuards'

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: HomeView, meta: { title: '首頁' } },
      { path: '/products', name: 'products', component: ProductListView, meta: { title: '商品列表' } },
      { path: '/products/:id', name: 'productDetail', component: ProductDetailView },
      { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true, title: '購物車' } },
      { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true, title: '登入' } },
      { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true, title: '註冊' } },
      { path: '/:pathMatch(.*)*', name: 'notFound', component: NotFoundView, meta: { title: '找不到頁面' } },
    ],
  })
  router.beforeEach(authNavigationGuard)
  router.afterEach((to) => {
    // Product pages set their own title once the product has loaded.
    if (to.name !== 'productDetail') document.title = buildPageTitle(to.meta.title)
  })
  return router
}
