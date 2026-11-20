import { reactive, computed } from 'vue'
import { api, fetchAll, photoUrl } from '../api/client'

// ===== Data PUBLIK (tanpa login): katalog, portofolio, FAQ, testimoni, kontak =====
export const state = reactive({
  status: 'idle', // idle | loading | ready | error
  error: '',
  categories: [], products: [], portfolios: [], faqs: [], testimonies: [],
  site: { about: '', address: '', hours: '', whatsapp: '', instagram: '' },
})

const photo = (x) => ({ id: x.id, src: photoUrl(x.url), alt: x.alt_text })
const mapProduct = (p) => ({
  id: p.slug, name: p.title, description: p.description || '',
  priceMin: p.price_min || 0, priceMax: p.price_max || 0,
  categoryId: p.category?.slug || '', categoryName: p.category?.title || '',
  packagings: p.packagings || [], packagingIds: (p.packagings || []).map((x) => x.id),
  photos: (p.photos || []).map(photo),
})
const mapPortfolio = (p) => ({ id: p.id, title: p.title, description: p.description || '', year: p.event_year, month: p.event_month, featured: p.is_featured, images: (p.photos || []).map(photo) })
const mapFaq = (f) => ({ id: f.id, q: f.question, a: f.answer })
const mapTestimony = (t) => ({ id: t.id, name: t.author_name, context: t.author_context || '', text: t.content, likes: t.upvote_count, productSlug: t.product?.slug || '', productTitle: t.product?.title || '' })

export async function loadPublic() {
  state.status = 'loading'; state.error = ''
  try {
    const [cats, prods, ports, faqs, tests, site] = await Promise.all([
      fetchAll('/categories'), fetchAll('/products'), fetchAll('/portfolios'), fetchAll('/faqs'), fetchAll('/testimonies'), api('/site-contents'),
    ])
    state.categories = cats.map((c) => ({ id: c.slug, name: c.title }))
    state.products = prods.map(mapProduct)
    state.portfolios = ports.map(mapPortfolio)
    state.faqs = faqs.map(mapFaq)
    state.testimonies = tests.map(mapTestimony)
    const s = site.data
    state.site = { about: s.about || '', address: s.address || '', hours: s.operating_hours || '', whatsapp: s.whatsapp || '', instagram: s.instagram || '' }
    state.status = 'ready'
  } catch (e) { state.error = e.message; state.status = 'error' }
}

// ---------- getter ----------
export const packagingList = computed(() => {
  const m = new Map(); state.products.forEach((p) => p.packagings.forEach((k) => m.set(k.id, k.title)))
  return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'id'))
})
export const nameOfCategory = (slug) => state.categories.find((c) => c.id === slug)?.name || ''
export const countInCategory = (slug) => state.products.filter((p) => p.categoryId === slug).length
export const coverOf = (p) => p.photos[0] || null

// ---------- kirim dari pengunjung (masuk antrean moderasi admin) ----------
export const submitQuestion = ({ q }) => api('/faqs', { method: 'POST', body: { question: q.trim() } })
export const submitTestimonial = ({ name, text, productSlug = '' }) =>
  api('/testimonies', { method: 'POST', body: { author_name: (name || '').trim() || 'Anonim', content: text.trim(), product_slug: productSlug || null } })

// Dukungan: server mencatat per IP dan tidak bisa dibatalkan. Browser mengingat testimoni yang sudah didukung.
const LK = 'citra-liked'
const liked = () => { try { return JSON.parse(localStorage.getItem(LK) || '[]') } catch { return [] } }
export const likedState = reactive({ ids: liked() })
export async function upvote(id) {
  const res = await api(`/testimonies/${id}/upvotes`, { method: 'POST' })
  const t = state.testimonies.find((x) => x.id === id); if (t) t.likes = res.upvote_count
  if (!likedState.ids.includes(id)) { likedState.ids = [...likedState.ids, id]; try { localStorage.setItem(LK, JSON.stringify(likedState.ids)) } catch { /* abaikan */ } }
}
