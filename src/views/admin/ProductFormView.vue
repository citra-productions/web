<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../../components/ui/AppIcon.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import KebabMenu from '../../components/ui/KebabMenu.vue'
import { adm, saveWithPhotos, setProductPublished } from '../../stores/admin'
import { errMsg } from '../../api/client'
import { siteConfig } from '../../config/site'
import { pickFiles, readImages, dataUrlToBlob } from '../../utils/image'
import { uid } from '../../utils/id'
import { toast } from '../../stores/toast'

const props = defineProps({ id: String })
const router = useRouter()
const existing = props.id ? adm.products.find((p) => String(p.id) === props.id) : null
const missing = !!props.id && !existing
const form = reactive({
  title: existing?.title || '', priceMin: existing?.price_min ?? '', priceMax: existing?.price_max ?? '',
  categoryId: existing?.category_id ?? '', packagingIds: [...(existing?.packaging_ids || [])],
  description: existing?.description || '', published: existing ? existing.is_published : true,
  featured: existing ? !!existing.is_featured : false,
})
// Foto: {key, id?, src, blob?, alt, origAlt}. id = sudah ada di server; blob = baru, diunggah saat "simpan".
// Alt disimpan per foto; origAlt dipakai untuk tahu apakah alt perlu dikirim ulang.
const photos = ref((existing?.photos || []).map((p) => ({ key: 's' + p.id, id: p.id, src: p.src, alt: p.alt_text || '', origAlt: p.alt_text || '' })))
const removed = ref([])
const active = ref(0), busy = ref(false), saving = ref(false), errs = reactive({})
const max = siteConfig.maxPhotosPerProduct
const cur = computed(() => photos.value[active.value])

async function addPhotos() {
  const room = max - photos.value.length
  if (room <= 0) return toast(`Maksimal ${max} foto per produk.`, 'err')
  const files = await pickFiles({ multiple: true }); if (!files.length) return
  busy.value = true
  const { images, errors } = await readImages(files, { max: room })
  const start = photos.value.length
  for (const src of images) photos.value.push({ key: 'n' + uid(), src, blob: await dataUrlToBlob(src), alt: '', origAlt: '' })
  if (images.length) active.value = start
  busy.value = false
  if (errors.length) toast(errors[0], 'err')
}
function removePhoto(i) { const [p] = photos.value.splice(i, 1); if (p.id) removed.value.push(p.id); active.value = Math.max(0, Math.min(active.value, photos.value.length - 1)) }
function makeCover(i) { const [p] = photos.value.splice(i, 1); photos.value.unshift(p); active.value = 0 }
const photoMenu = [{ label: 'jadikan foto utama', icon: 'star' }, { label: 'hapus foto', icon: 'trash', danger: true }]
function onPhotoMenu(i) { if (i === 0) makeCover(active.value); else removePhoto(active.value) }
const togglePack = (id) => { const i = form.packagingIds.indexOf(id); if (i > -1) form.packagingIds.splice(i, 1); else form.packagingIds.push(id) }

function validate() {
  Object.keys(errs).forEach((k) => delete errs[k])
  const t = form.title.trim()
  if (!t) errs.title = 'Nama produk wajib diisi.'
  const hasMin = form.priceMin !== '' && form.priceMin !== null, hasMax = form.priceMax !== '' && form.priceMax !== null
  if (hasMin && !(Number(form.priceMin) >= 0)) errs.priceMin = 'Harga harus berupa angka ≥ 0.'
  if (hasMax && !hasMin) errs.priceMin = 'Isi harga awal bila harga maksimal diisi.'
  if (hasMin && hasMax && !(Number(form.priceMax) >= Number(form.priceMin))) errs.priceMax = 'Harga maksimal harus ≥ harga awal.'
  if (form.published) {
    if (!hasMin) errs.priceMin = 'Harga wajib diisi agar produk bisa tayang.'
    if (!form.categoryId) errs.categoryId = 'Pilih kategori agar produk bisa tayang.'
  }
  return !Object.keys(errs).length
}
async function save() {
  if (!validate()) return toast('Periksa kembali isian yang ditandai merah.', 'err')
  const t = form.title.trim()
  const hasMin = form.priceMin !== '' && form.priceMin !== null
  const min = hasMin ? Number(form.priceMin) : null
  const max2 = hasMin ? (form.priceMax === '' || form.priceMax === null ? min : Number(form.priceMax)) : null // harga tunggal = rentang min..min
  const body = { title: t, description: form.description.trim() || null, category_id: form.categoryId || null, price_min: min, price_max: max2, packaging_ids: form.packagingIds, is_featured: form.featured }
  if (existing) body.is_published = form.published
  saving.value = true
  try {
    const saved = await saveWithPhotos({
      base: 'products', kind: 'product', id: existing?.id, body, photos: photos.value, removedIds: removed.value,
      defaultAlt: t.slice(0, 150),
    })
    if (!existing && form.published) await setProductPublished(saved.id, true)
    toast(existing ? 'Perubahan produk disimpan.' : 'Produk baru ditambahkan.')
    router.push({ name: 'admin-products' })
  } catch (e) { toast(errMsg(e), 'err') } finally { saving.value = false }
}
const back = () => router.push({ name: 'admin-products' })
</script>
<template>
  <div class="a-wrap fm">
    <button class="bk" @click="back"><AppIcon name="arrow-left" :size="18" />kembali</button>
    <div v-if="missing" class="card nf"><p>Produk tidak ditemukan.</p><BaseButton @click="back">Kembali ke daftar</BaseButton></div>
    <form v-else class="card" novalidate @submit.prevent="save">
      <div class="a-head"><h1>{{ existing ? 'Edit' : 'Tambah' }} Product</h1><span class="a-hint">Form input produk</span></div>
      <label class="label first">Foto produk</label>

      <button v-if="!photos.length" type="button" class="dz" :disabled="busy" @click="addPhotos">
        <span class="ic"><AppIcon name="image" :size="18" /><AppIcon name="image" :size="18" /><span class="pl"><AppIcon name="plus" :size="14" /></span></span>
        <strong>{{ busy ? 'Memproses foto…' : `Klik untuk upload foto (Max ${max} file)` }}</strong><small>PNG, JPG, WEBP maks 2MB</small>
      </button>
      <div v-else>
        <div class="mp">
          <img :src="cur.src" :alt="cur.alt || form.title || 'Foto produk'" />
          <span class="tg">foto {{ active + 1 }}/{{ photos.length }}{{ cur.blob ? ' · baru' : '' }}</span>
          <div class="kmw"><KebabMenu :items="photoMenu" dark align="left" label="Menu foto" @select="onPhotoMenu" /></div>
        </div>
        <div class="th">
          <button v-for="(p, i) in photos" :key="p.key" type="button" class="t" :class="{ on: i === active }" :aria-label="`Foto ${i + 1}`" @click="active = i"><img :src="p.src" alt="" /></button>
          <button v-if="photos.length < max" type="button" class="t add" :disabled="busy" aria-label="Tambah foto" @click="addPhotos"><AppIcon name="plus" :size="18" /></button>
        </div>
      </div>

      <div class="a-row">
        <div><label class="label" for="nm">Nama Produk</label><input id="nm" v-model="form.title" class="input" :class="{ invalid: errs.title }" placeholder="Contoh: Plakat Kayu" maxlength="100" /><p v-if="errs.title" class="err">{{ errs.title }}</p></div>
        <div><label class="label" for="hg">Harga awal (Rp)</label><input id="hg" v-model="form.priceMin" type="number" min="0" inputmode="numeric" class="input" :class="{ invalid: errs.priceMin }" placeholder="Rp 12.000" /><p v-if="errs.priceMin" class="err">{{ errs.priceMin }}</p></div>
      </div>
      <div class="a-row">
        <div><label class="label" for="hm">Harga maksimal (opsional)</label><input id="hm" v-model="form.priceMax" type="number" min="0" inputmode="numeric" class="input" :class="{ invalid: errs.priceMax }" placeholder="Untuk rentang harga" /><p v-if="errs.priceMax" class="err">{{ errs.priceMax }}</p></div>
        <div><label class="label" for="ct">Kategori Product</label>
          <select id="ct" v-model="form.categoryId" class="input" :class="{ invalid: errs.categoryId }"><option value="">Pilih kategori</option><option v-for="c in adm.categories" :key="c.id" :value="c.id">{{ c.title }}</option></select><p v-if="errs.categoryId" class="err">{{ errs.categoryId }}</p></div>
      </div>
      <label class="label">Jenis Packaging (boleh lebih dari satu)</label>
      <div class="pk">
        <label v-for="k in adm.packagings" :key="k.id" class="pkc"><input type="checkbox" :checked="form.packagingIds.includes(k.id)" @change="togglePack(k.id)" />{{ k.title }}</label>
        <p v-if="!adm.packagings.length" class="muted pe">Belum ada packaging. Tambahkan di halaman Produk dan Kategori.</p>
      </div>
      <label class="label" for="ds">Deskripsi produk</label>
      <textarea id="ds" v-model="form.description" class="input" rows="4" placeholder="Jelaskan bahan, ukuran, dan keunggulan produk (tampil di halaman detail)" maxlength="2000" />
      <template v-if="cur">
        <label class="label" for="alt">Teks alternatif foto {{ active + 1 }} (alt)</label>
        <textarea id="alt" v-model="cur.alt" class="input" rows="2" :placeholder="`Deskripsi foto ${active + 1} untuk pembaca layar. Contoh: Plakat kayu ukir warna cokelat`" maxlength="150" />
        <p class="fnh">Alt diisi terpisah untuk tiap foto. Bila dikosongkan, dipakai nama produk.</p>
      </template>
      <label class="chk"><input v-model="form.published" type="checkbox" /> Tayangkan produk di katalog</label>
      <label class="chk"><input v-model="form.featured" type="checkbox" /> Tampilkan di beranda</label>
      <p class="fnh">Produk pilihan tampil di bagian “Produk Pilihan” pada beranda. Hanya produk yang tayang yang muncul di sana.</p>
      <BaseButton block size="large" class="sv" :loading="saving">{{ saving ? 'menyimpan…' : existing ? 'simpan perubahan produk' : 'tambah produk baru' }}</BaseButton>
    </form>
  </div>
</template>
<style scoped>
.fm { max-width: 640px; } .bk { display: inline-flex; gap: 8px; align-items: center; border: none; background: none; font-weight: 600; font-size: 14px; padding: 4px 0; margin-bottom: 12px; } h1 { font-size: 22px; } .label.first { margin-top: 4px; font-size: 14px; font-weight: 400; }
.dz { width: 100%; display: grid; gap: 6px; justify-items: center; padding: 28px 16px; background: #fafafa; border: 1.5px dashed #CBD0D8; border-radius: var(--r-12); font-size: 13px; } .dz small { color: var(--muted); font-size: 11px; }
.ic { display: flex; gap: 8px; color: #666; } .ic > svg { padding: 7px; width: 36px; height: 36px; background: #E7E8EB; border-radius: var(--r-8); } .pl { width: 36px; height: 36px; border: 1.5px dashed #CBD0D8; border-radius: var(--r-8); display: flex; align-items: center; justify-content: center; }
.mp { position: relative; aspect-ratio: 1 / 1; border-radius: var(--r-12); background: var(--tint); } .mp img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--r-12); } .dim { opacity: .45; }
.tg { position: absolute; left: 10px; bottom: 10px; background: #fff; border-radius: var(--r-4); padding: 1px 12px; font-size: 12px; } .kmw { position: absolute; top: 8px; left: 8px; }
.th { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; } .t { flex: 0 0 auto; width: 56px; height: 56px; padding: 0; border-radius: var(--r-6); border: 2px solid transparent; overflow: hidden; background: var(--tint); } .t img { width: 100%; height: 100%; object-fit: cover; } .t.on { border-color: var(--navy); } .t.add { border: 1.5px dashed #CBD0D8; background: #fff; color: var(--muted); display: flex; align-items: center; justify-content: center; }
.pk { display: flex; flex-wrap: wrap; gap: 8px; } .pkc { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--r-8); background: #fff; } .pe { font-size: 12px; }
.chk { display: flex; gap: 8px; align-items: center; font-size: 14px; margin-top: 16px; } .sv { margin-top: 18px; border-radius: var(--r-8); } .nf { text-align: center; display: grid; gap: 12px; justify-items: center; }
.fnh { font-size: 11px; color: var(--muted); margin-top: 4px; }
</style>
