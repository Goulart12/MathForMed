import {
  createRouter,
  createWebHashHistory,
  type Router,
  type RouteRecordRaw,
} from 'vue-router'

/**
 * Hash history is deliberate: the service worker pre-caches `index.html` and the
 * app must boot from a cold offline start with no server rewrite rule, which
 * rules out `createWebHistory`.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'MedCalc' },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
    meta: { title: 'Buscar' },
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { title: 'Favoritos' },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
    meta: { title: 'Histórico' },
  },
  {
    path: '/category/:slug',
    name: 'category',
    component: () => import('@/views/CategoryView.vue'),
    props: true,
    meta: { title: 'Categoria' },
  },
  {
    path: '/calc/:id',
    name: 'calculator',
    component: () => import('@/views/CalculatorView.vue'),
    props: true,
    meta: { title: 'Calculadora' },
  },
  // A bare path rather than `{ name: 'home' }`: a named redirect inherits this
  // record's `pathMatch` param and vue-router warns about discarding it.
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

/**
 * Builds a router instance. A factory rather than a module-level singleton so a
 * test can spin up an isolated router — with the same route table, the same
 * history mode and the same title behaviour — instead of reaching into shared
 * module state.
 */
export function createAppRouter(): Router {
  const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 }),
  })

  router.afterEach((to) => {
    const title = to.meta.title
    document.title = typeof title === 'string' && title ? `MedCalc · ${title}` : 'MedCalc'
  })

  return router
}

export default createAppRouter()
