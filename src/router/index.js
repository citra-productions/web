import { createRouter, createWebHistory } from 'vue-router'
import { auth, verify } from '../stores/auth'
import { loadPublic } from '../stores/store'
import PublicLayout from '../views/PublicLayout.vue'
import HomeView from '../views/HomeView.vue'
import CatalogView from '../views/CatalogView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import SearchView from '../views/SearchView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: PublicLayout, children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'katalog', name: 'catalog', component: CatalogView },
      { path: 'cari', name: 'search', component: SearchView },
      { path: 'produk/:id', name: 'product', component: ProductDetailView, props: true },
    ] },
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/LoginView.vue') },
    { path: '/admin', component: () => import('../views/admin/AdminLayout.vue'), meta: { admin: true }, children: [
      { path: '', name: 'admin', component: () => import('../views/admin/AdminHome.vue') },
      { path: 'produk-kategori', name: 'admin-products', component: () => import('../views/admin/pages/ProductsPage.vue') },
      { path: 'portofolio', name: 'admin-portfolio', component: () => import('../views/admin/pages/PortfolioPage.vue') },
      { path: 'testimoni', name: 'admin-testimonials', component: () => import('../views/admin/pages/TestimonialsPage.vue') },
      { path: 'faq', name: 'admin-faq', component: () => import('../views/admin/pages/FaqPage.vue') },
      { path: 'kontak', name: 'admin-contacts', component: () => import('../views/admin/pages/ContactsPage.vue') },
      { path: 'kontak/edit', name: 'admin-contacts-edit', component: () => import('../views/admin/ContactEditView.vue') },
      { path: 'produk/baru', name: 'admin-product-new', component: () => import('../views/admin/ProductFormView.vue') },
      { path: 'produk/:id', name: 'admin-product-edit', component: () => import('../views/admin/ProductFormView.vue'), props: true },
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, _from, saved) {
    if (/^#[A-Za-z][\w-]*$/.test(to.hash)) return { el: to.hash, top: 84, behavior: 'smooth' }
    return saved || { top: 0 }
  },
})
router.beforeEach(async (to) => {
  if (!to.matched.some((r) => r.meta.admin)) return
  if (!auth.ok) return { name: 'admin-login', query: { redirect: to.fullPath } }
  // Pastikan token masih berlaku (sekali per sesi tab).
  if (!auth.verified) {
    try { if (!(await verify())) return { name: 'admin-login', query: { redirect: to.fullPath } } } catch { /* server tak terjangkau: biarkan halaman menampilkan pesan error */ }
  }
})
// Setelah admin mengubah data, muat ulang data publik agar website langsung menampilkan perubahan.
router.afterEach((to, from) => { if (from.meta?.admin && !to.meta?.admin && !to.path.startsWith('/admin')) loadPublic() })
export default router
