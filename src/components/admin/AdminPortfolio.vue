<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import ModalBox from '../ui/ModalBox.vue'
import ActionConfirm from '../ui/ActionConfirm.vue'
import PaginationBar from '../ui/PaginationBar.vue'
import { adm, saveWithPhotos, removePortfolio } from '../../stores/admin'
import { errMsg } from '../../api/client'
import { siteConfig } from '../../config/site'
import { pickFiles, readImages, dataUrlToBlob } from '../../utils/image'
import { uid } from '../../utils/id'
import { toast } from '../../stores/toast'
const MAXIMG = siteConfig.maxPhotosPerPortfolio
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const page = ref(1), per = 2
const total = computed(() => Math.max(1, Math.ceil(adm.portfolios.length / per)))
const paged = computed(() => adm.portfolios.slice((page.value - 1) * per, page.value * per))
watch(total, (t) => { if (page.value > t) page.value = t })
// form: null = tertutup | { id?, title, description, month, year, featured, published, images:[{key,id?,src,blob?,alt}], removed:[] }
const form = ref(null), errs = ref({}), busy = ref(false), saving = ref(false), confirmSave = ref(false), del = ref(null)
const now = new Date()
const openAdd = () => { form.value = { id: null, title: '', description: '', month: now.getMonth() + 1, year: now.getFullYear(), featured: false, published: true, images: [], removed: [] }; errs.value = {} }
const openEdit = (p) => { form.value = { id: p.id, title: p.title, description: p.description || '', month: p.event_month, year: p.event_year, featured: p.is_featured, published: p.is_published, images: p.photos.map((g) => ({ key: 's' + g.id, id: g.id, src: g.src, alt: g.alt_text || '', origAlt: g.alt_text || '' })), removed: [] }; errs.value = {} }
async function addImages() {
  const room = MAXIMG - form.value.images.length
  if (room <= 0) return toast(`Maksimal ${MAXIMG} gambar per portofolio.`, 'err')
  const files = await pickFiles({ multiple: true }); if (!files.length) return
  busy.value = true; const { images, errors } = await readImages(files, { max: room })
  for (const src of images) form.value.images.push({ key: 'n' + uid(), src, blob: await dataUrlToBlob(src), alt: '', origAlt: '' })
  busy.value = false
  if (errors.length) toast(errors[0], 'err')
}
function dropImage(i) { const [g] = form.value.images.splice(i, 1); if (g.id) form.value.removed.push(g.id) }
function ask() {
  const e = {}
  if (!form.value.title.trim()) e.title = 'Judul portofolio wajib diisi.'
  const y = Number(form.value.year); if (!(y >= 2000 && y <= 2100)) e.year = 'Tahun 2000–2100.'
  errs.value = e
  if (!Object.keys(e).length) confirmSave.value = true
}
async function doSave() {
  const f = form.value, wasNew = !f.id; saving.value = true
  try {
    await saveWithPhotos({
      base: 'portfolios', kind: 'portfolio', id: f.id, photos: f.images, removedIds: f.removed, defaultAlt: f.title.trim().slice(0, 150),
      body: { title: f.title.trim(), description: f.description.trim() || null, event_year: Number(f.year), event_month: Number(f.month), is_featured: f.featured, is_published: f.published },
    })
    toast(wasNew ? 'Portofolio ditambahkan.' : 'Portofolio diperbarui.'); confirmSave.value = false; form.value = null
  } catch (e) { confirmSave.value = false; toast(errMsg(e), 'err') } finally { saving.value = false }
}
async function doDel() { try { await removePortfolio(del.value.id); toast('Portofolio dihapus.') } catch (e) { toast(errMsg(e), 'err') } del.value = null }
</script>
<template>
  <section id="portofolio" class="a-section">
    <div class="a-head"><h2>Kelola Portofolio</h2></div>
    <div class="card">
      <p v-if="!adm.portfolios.length" class="muted emp">Belum ada portofolio.</p>
      <article v-for="p in paged" :key="p.id" class="pi" :class="{ off: !p.is_published }">
        <div class="tx">
          <h3>{{ p.title }} <span v-if="!p.is_published" class="badge badge--off">Draft</span></h3><p>{{ p.description || `${MONTHS[p.event_month - 1]} ${p.event_year}` }}</p>
          <div class="ac">
            <button class="bt" @click="openEdit(p)"><AppIcon name="edit" :size="14" />Edit</button>
            <button class="bt bt--red" :aria-label="`Hapus portofolio ${p.title}`" @click="del = p"><AppIcon name="trash" :size="14" /></button>
          </div>
        </div>
        <div class="cv"><div class="fr"><img v-if="p.photos.length" :src="p.photos[0].src" :alt="p.photos[0].alt_text" /><div v-else class="ph"><AppIcon name="image" :size="30" /></div></div><p class="cap">{{ p.title }} <span v-if="p.photos.length > 1" class="mu">· {{ p.photos.length }} gambar</span></p></div>
      </article>
      <PaginationBar v-model:page="page" :total="total" />
      <div class="two">
        <BaseButton variant="outline" block @click="openAdd"><template #icon><AppIcon name="plus" :size="16" /></template>Tambah portofolio</BaseButton>
        <BaseButton block :disabled="!paged.length" @click="openEdit(paged[0])">Edit portofolio</BaseButton>
      </div>
    </div>

    <ModalBox :open="!!form" :title="form?.id ? 'Edit Portofolio' : 'Tambah Portofolio'" width="480px" @close="form = null">
      <form v-if="form" novalidate @submit.prevent="ask">
        <label class="label first" for="pt">Judul portofolio</label><input id="pt" v-model="form.title" class="input" :class="{ invalid: errs.title }" placeholder="Contoh: Wisuda SMA Negeri 1 Bandung" maxlength="80" /><p v-if="errs.title" class="err">{{ errs.title }}</p>
        <label class="label" for="pd">Deskripsi singkat</label><input id="pd" v-model="form.description" class="input" placeholder="Tuliskan deskripsi portofolio" maxlength="300" />
        <div class="a-row"><div><label class="label" for="pm">Bulan acara</label><select id="pm" v-model="form.month" class="input"><option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option></select></div>
          <div><label class="label" for="py">Tahun acara</label><input id="py" v-model="form.year" type="number" min="2000" max="2100" class="input" :class="{ invalid: errs.year }" /><p v-if="errs.year" class="err">{{ errs.year }}</p></div></div>
        <label class="chk"><input v-model="form.published" type="checkbox" /> Tayangkan di website</label>
        <label class="chk"><input v-model="form.featured" type="checkbox" /> Tampilkan di beranda (featured)</label>
        <label class="label">Gambar portofolio</label>
        <button v-if="!form.images.length" type="button" class="dz" :disabled="busy" @click="addImages"><AppIcon name="upload" :size="20" /><strong>{{ busy ? 'Memproses gambar…' : 'Tarik beberapa gambar ke sini atau pilih file' }}</strong><small>Bisa lebih dari satu gambar JPG, PNG, atau WEBP, maksimal 2 MB per gambar</small></button>
        <div v-else class="im">
          <div v-for="(g, i) in form.images" :key="g.key" class="th"><img :src="g.src" alt="" /><button type="button" class="x" :aria-label="`Hapus gambar ${i + 1}`" @click="dropImage(i)"><AppIcon name="close" :size="10" /></button><span v-if="i === 0" class="cv2">Sampul</span></div>
          <button v-if="form.images.length < MAXIMG" type="button" class="th add" :disabled="busy" aria-label="Tambah gambar" @click="addImages"><AppIcon name="plus" :size="16" />Tambah</button>
        </div>
        <div class="ft"><button type="button" class="bt bt--out" @click="form = null">Batal</button><button class="bt bt--navy" :disabled="saving">Simpan</button></div>
      </form>
    </ModalBox>
    <ActionConfirm :open="confirmSave" title="Simpan portofolio ini?" message="Gambar dan data portofolio akan disimpan dan langsung tampil di daftar portofolio." item-label="Portofolio" :item-text="form?.title" icon="check" tone="primary" confirm-label="Ya, Simpan" @confirm="doSave" @cancel="confirmSave = false" />
    <ActionConfirm :open="!!del" title="Hapus portofolio ini?" message="Portofolio beserta gambarnya akan dihapus permanen dan tidak bisa dikembalikan." item-label="Portofolio" :item-text="del?.title" @confirm="doDel" @cancel="del = null" />
  </section>
</template>
<style scoped>
.card { padding: 4px 14px 14px; } .emp { padding: 14px 0; font-size: 14px; }
.pi { display: grid; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--border); } .pi.off { opacity: .55; }
.tx h3 { font-size: 16px; margin-bottom: 2px; } .tx p { font-size: 13px; color: var(--muted); margin-bottom: 10px; } .ac { display: flex; gap: 8px; }
.cv { border: 1px solid var(--border); border-radius: var(--r-8); padding: 6px; } .fr { aspect-ratio: 16 / 9; border-radius: var(--r-6); overflow: hidden; background: var(--tint); } .fr img, .ph { width: 100%; height: 100%; object-fit: cover; } .ph { display: flex; align-items: center; justify-content: center; color: var(--muted); } .cap { font-size: 12px; margin: 6px 2px 0; } .mu { color: var(--muted); }
.add { margin-top: 12px; border-radius: var(--r-8); }
.bt { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--r-6); border: 1px solid var(--navy); color: var(--navy); background: #fff; font-size: 12px; font-weight: 600; } .bt--red { border-color: var(--red); color: var(--red); } .bt--out { border-color: var(--border); color: var(--text); } .bt--navy { background: var(--navy); color: #fff; }
.label.first { margin-top: 0; } .dz { width: 100%; display: grid; gap: 4px; justify-items: center; padding: 20px 12px; background: #fafafa; border: 1.5px dashed #CBD0D8; border-radius: var(--r-8); font-size: 12px; text-align: center; } .dz small { color: var(--muted); font-size: 10px; }
.im { display: flex; flex-wrap: wrap; gap: 8px; } .th { position: relative; width: 84px; height: 62px; border-radius: var(--r-6); overflow: hidden; background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 12px 12px; border: 1px solid var(--border); padding: 0; } .th img { width: 100%; height: 100%; object-fit: cover; }
.x { position: absolute; top: 3px; right: 3px; width: 16px; height: 16px; border: none; border-radius: 50%; background: rgba(255,255,255,.9); display: flex; align-items: center; justify-content: center; } .cv2 { position: absolute; left: 3px; bottom: 3px; background: var(--navy); color: #fff; font-size: 9px; padding: 1px 6px; border-radius: var(--r-4); }
.th.add { border: 1.5px dashed #CBD0D8; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; color: var(--muted); }
.chk { display: flex; gap: 8px; align-items: center; font-size: 13px; margin-top: 12px; } .tx h3 .badge { margin-left: 6px; vertical-align: middle; }
.ft { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
@media (min-width: 720px) { .pi { grid-template-columns: 1fr 1.1fr; align-items: center; gap: 24px; } .tx { padding-left: 20px; } }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
</style>
