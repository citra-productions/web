import { reactive } from 'vue'

// Alamat API dibaca dari .env (VITE_API_BASE_URL). Tanpa secret: nilai VITE_ ikut terkirim ke browser.
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '')
export const API_ORIGIN = (() => { try { return new URL(BASE_URL, window.location.href).origin } catch { return '' } })()

const TK = 'admin_token'
const read = () => { try { return localStorage.getItem(TK) || '' } catch { return '' } }
export const session = reactive({ token: read() })
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }
export function setToken(value) {
  session.token = value || ''
  try { value ? localStorage.setItem(TK, value) : localStorage.removeItem(TK) } catch { /* penyimpanan diblokir: token hanya hidup selama tab terbuka */ }
}

export class ApiError extends Error {
  constructor(message, { status = 0, errors, retryAfter } = {}) { super(message); this.status = status; this.errors = errors; this.retryAfter = retryAfter }
}

// URL dari `links.next` bisa berupa URL penuh atau path yang diawali "/".
const resolve = (path) => (/^https?:\/\//.test(path) ? path : path.startsWith('/api/') ? API_ORIGIN + path : BASE_URL + path)
// Foto dikembalikan sebagai path relatif (mis. /storage/...) → tempelkan alamat server.
// `v` dinaikkan saat file demo diganti agar cache immutable tidak menyajikan gambar lama.
export const photoUrl = (u) => {
  if (!u) return ''
  if (/^(data:|blob:)/.test(u)) return u
  const url = /^https?:/.test(u) ? u : API_ORIGIN + u
  return url + (url.includes('?') ? '&' : '?') + '+?v=3'
}

export async function api(path, { method = 'GET', body, form, auth = false } = {}) {
  const headers = { Accept: 'application/json' }
  let payload
  if (form) payload = form
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`
  let res
  try { res = await fetch(resolve(path), { method, headers, body: payload }) }
  catch { throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend berjalan dan alamat API benar.') }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized()
    throw new ApiError(data?.message || `HTTP ${res.status}`, { status: res.status, errors: data?.errors, retryAfter: res.headers.get('Retry-After') })
  }
  return data
}

// Pesan yang ramah untuk pengguna. Pesan validasi diambil dari field pertama.
export function errMsg(e) {
  if (!(e instanceof ApiError)) return 'Terjadi kesalahan. Coba lagi.'
  if (e.status === 429) return `Terlalu banyak percobaan. Coba lagi dalam ${e.retryAfter || 'beberapa'} detik.`
  if (e.status === 422 && e.errors) { const first = Object.values(e.errors)[0]; if (first?.[0]) return first[0] }
  return e.message
}

// Muat semua halaman sebuah daftar (per_page maksimum 50) lalu buang duplikat berdasarkan id/slug.
export async function fetchAll(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?'
  let url = `${path}${sep}per_page=50`
  const out = [], seen = new Set()
  for (let i = 0; i < 100 && url; i++) {
    const page = await api(url, opts)
    for (const it of page.data) { const k = it.id ?? it.slug; if (!seen.has(k)) { seen.add(k); out.push(it) } }
    url = page.links?.next || null
  }
  return out
}
