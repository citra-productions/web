import { reactive } from 'vue'
import { api, fetchAll, photoUrl } from '../api/client'
import { state as pub } from './store'

// ===== Data ADMIN (butuh token): semua entri termasuk draft/pending/ditolak =====
export const adm = reactive({
  loaded: false, loading: false, error: '',
  dashboard: null, products: [], categories: [], packagings: [], portfolios: [], faqs: [], testimonies: [],
})
const withSrc = (o) => ({ ...o, is_featured: !!o.is_featured, photos: (o.photos || []).map((p) => ({ ...p, src: photoUrl(p.url) })) })
const SOURCES = {
  products: () => fetchAll('/admin/products', { auth: true }).then((l) => l.map(withSrc)),
  categories: () => fetchAll('/admin/categories', { auth: true }),
  packagings: () => fetchAll('/admin/packagings', { auth: true }),
  portfolios: () => fetchAll('/admin/portfolios', { auth: true }).then((l) => l.map(withSrc)),
  faqs: () => fetchAll('/admin/faqs', { auth: true }),
  testimonies: () => fetchAll('/admin/testimonies', { auth: true }),
}
export async function refresh(...keys) {
  await Promise.all([
    ...keys.map(async (k) => { adm[k] = await SOURCES[k]() }),
    api('/admin/dashboard', { auth: true }).then((r) => { adm.dashboard = r.data }),
  ])
}
export async function loadAdmin(force = false) {
  if (adm.loading || (adm.loaded && !force)) return
  adm.loading = true; adm.error = ''
  try { await refresh(...Object.keys(SOURCES)); adm.loaded = true } catch (e) { adm.error = e.message } finally { adm.loading = false }
}
export const resetAdmin = () => { adm.loaded = false }
const A = { auth: true }

// ---------- kategori & packaging ----------
export const addCategory = async (title) => { await api('/admin/categories', { ...A, method: 'POST', body: { title: title.trim() } }); await refresh('categories') }
export const renameCategory = async (id, title) => { await api(`/admin/categories/${id}`, { ...A, method: 'PATCH', body: { title: title.trim() } }); await refresh('categories', 'products') }
export const removeCategory = async (id) => { await api(`/admin/categories/${id}`, { ...A, method: 'DELETE' }); await refresh('categories') }
export const addPackaging = async (title) => { await api('/admin/packagings', { ...A, method: 'POST', body: { title: title.trim() } }); await refresh('packagings') }
export const renamePackaging = async (id, title) => { await api(`/admin/packagings/${id}`, { ...A, method: 'PATCH', body: { title: title.trim() } }); await refresh('packagings') }
export const removePackaging = async (id) => { await api(`/admin/packagings/${id}`, { ...A, method: 'DELETE' }); await refresh('packagings') }

// ---------- produk ----------
export const setProductPublished = async (id, is_published) => { await api(`/admin/products/${id}`, { ...A, method: 'PATCH', body: { is_published } }); await refresh('products') }
export const removeProduct = async (id) => { await api(`/admin/products/${id}`, { ...A, method: 'DELETE' }); await refresh('products') }

// ---------- foto (produk & portofolio memakai bentuk endpoint yang sama) ----------
export async function uploadPhoto(base, id, blob, alt) {
  const form = new FormData(); form.append('file', blob, 'foto.jpg'); form.append('alt_text', alt)
  return (await api(`/admin/${base}/${id}/photos`, { ...A, method: 'POST', form })).data
}
export const deletePhoto = (kind, photoId) => api(`/admin/${kind}-photos/${photoId}`, { ...A, method: 'DELETE' })
export const renamePhoto = (kind, photoId, alt_text) => api(`/admin/${kind}-photos/${photoId}`, { ...A, method: 'PATCH', body: { alt_text } })
export const reorderPhotos = (base, id, ids) => api(`/admin/${base}/${id}/photos/order`, { ...A, method: 'PUT', body: { ids } })
// Simpan produk/portofolio beserta perubahan fotonya.
// `photos` = urutan akhir: {id?, src, blob?, alt, origAlt}. Alt disimpan per foto; `defaultAlt` hanya dipakai bila alt foto kosong.
export async function saveWithPhotos({ base, kind, id, body, photos, removedIds = [], defaultAlt = '' }) {
  const saved = (await api(id ? `/admin/${base}/${id}` : `/admin/${base}`, { ...A, method: id ? 'PATCH' : 'POST', body })).data
  const oid = saved.id
  for (const pid of removedIds) await deletePhoto(kind, pid)
  const finalIds = []
  for (const p of photos) {
    const alt = (p.alt || '').trim().slice(0, 150) || defaultAlt
    if (p.id) {
      if (alt !== (p.origAlt || '')) await renamePhoto(kind, p.id, alt)
      finalIds.push(p.id)
    } else finalIds.push((await uploadPhoto(base, oid, p.blob, alt)).id)
  }
  const before = (saved.photos || []).map((p) => p.id).filter((x) => !removedIds.includes(x))
  if (finalIds.length > 1 && finalIds.join() !== before.join()) await reorderPhotos(base, oid, finalIds)
  await refresh(base)
  return saved
}

// ---------- portofolio ----------
export const removePortfolio = async (id) => { await api(`/admin/portfolios/${id}`, { ...A, method: 'DELETE' }); await refresh('portfolios') }

// ---------- FAQ & testimoni (status: pending → published | rejected; published ↔ withdrawn) ----------
export const createFaq = async ({ question, answer }) => { await api('/admin/faqs', { ...A, method: 'POST', body: { question, answer, publish: true } }); await refresh('faqs') }
export const patchFaq = async (id, body) => { await api(`/admin/faqs/${id}`, { ...A, method: 'PATCH', body }); await refresh('faqs') }
export const removeFaq = async (id) => { await api(`/admin/faqs/${id}`, { ...A, method: 'DELETE' }); await refresh('faqs') }
export const patchTestimony = async (id, body) => { await api(`/admin/testimonies/${id}`, { ...A, method: 'PATCH', body }); await refresh('testimonies') }
export const removeTestimony = async (id) => { await api(`/admin/testimonies/${id}`, { ...A, method: 'DELETE' }); await refresh('testimonies') }

// ---------- kontak / konten situs ----------
export async function saveSite(body) {
  const { data } = await api('/site-contents', { ...A, method: 'PUT', body })
  pub.site = { about: data.about || '', address: data.address || '', hours: data.operating_hours || '', whatsapp: data.whatsapp || '', instagram: data.instagram || '' }
}
