<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/ui/AppIcon.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import PhotoCarousel from '../components/ui/PhotoCarousel.vue'
import { state } from '../stores/store'
import { priceLabel } from '../utils/format'
import { toast } from '../stores/toast'
import { useWhatsapp } from '../composables/useWhatsapp'
const props = defineProps({ id: String })
const router = useRouter(); const { waLink } = useWhatsapp()
const p = computed(() => state.products.find((x) => x.id === props.id))
const loading = computed(() => state.status === 'idle' || state.status === 'loading')
const photos = computed(() => (p.value ? p.value.photos : []))
const specs = computed(() => p.value ? [['Kategori', p.value.categoryName || '-'], ['Packaging', p.value.packagings.map((k) => k.title).join(', ') || '-']] : [])
const wa = computed(() => p.value ? waLink(`Halo, saya tertarik dengan "${p.value.name}" (${priceLabel(p.value)}). Boleh minta info dan penawaran?`) : '#')
const back = () => (window.history.length > 1 ? router.back() : router.push({ name: 'catalog' }))
async function share() {
  const url = location.href
  try { if (navigator.share) { await navigator.share({ title: p.value.name, url }); return } await navigator.clipboard.writeText(url); toast('Tautan produk disalin.') }
  catch (e) { if (e?.name !== 'AbortError') toast('Tidak bisa membagikan, salin tautan dari bilah alamat.', 'err') }
}
</script>
<template>
  <div class="container dt">
    <button class="bk" @click="back"><AppIcon name="arrow-left" :size="18" />kembali</button>
    <p v-if="loading" class="muted ld">Memuat produk…</p>
    <div v-else-if="!p" class="nf card"><h1>Produk tidak ditemukan</h1><p class="muted">Produk ini mungkin sudah dihapus atau disembunyikan.</p><BaseButton :as="'RouterLink'" :to="{ name: 'catalog' }">Lihat katalog</BaseButton></div>
    <div v-else class="gr">
      <PhotoCarousel :photos="photos" :alt="p.name" :label="p.name" />
      <div class="if">
        <p class="pr">{{ priceLabel(p) }}</p>
        <h1>{{ p.name }}</h1>
        <h2>Spesifikasi</h2>
        <dl><div v-for="[k, v] in specs" :key="k"><dt>{{ k }}:</dt><dd>{{ v }}</dd></div></dl>
        <template v-if="p.description"><h2>Deskripsi</h2><p class="ds">{{ p.description }}</p></template>
        <div class="cta">
          <BaseButton as="a" variant="whatsapp" size="large" :href="wa" target="_blank" rel="noopener" class="wb"><template #icon><AppIcon name="chat" :size="18" /></template>WhatsApp</BaseButton>
          <button class="icon-btn sh" aria-label="Bagikan produk" @click="share"><AppIcon name="share" :size="18" /></button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.dt { padding-top: 18px; padding-bottom: 40px; } .bk { display: inline-flex; gap: 8px; align-items: center; border: none; background: none; font-weight: 600; font-size: 14px; padding: 4px 0; margin-bottom: 14px; }
.gr { display: grid; gap: 20px; } .pr { font-size: clamp(16px, 1rem + .4vw, 20px); line-height: 1.4; color: var(--navy); margin-bottom: 4px; } h1 { font-size: clamp(20px, 1rem + .8vw, 26px); line-height: 1.3; margin-bottom: 20px; }
h2 { font-size: 15px; margin-bottom: 8px; } dl { margin: 0 0 20px; } .ds { font-size: 13px; line-height: 20px; color: #3a4150; margin-bottom: 20px; white-space: pre-line; } dl div { display: flex; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 14px; } dt { width: 42%; color: var(--muted); } dd { margin: 0; }
.cta { position: sticky; bottom: 12px; display: flex; gap: 10px; background: #fff; padding: 10px; border: 1px solid var(--border); border-radius: var(--r-full); box-shadow: var(--sh-lg); } .wb { flex: 1; } .sh { border-radius: 50%; }
.ld { padding: 40px 0; text-align: center; } .nf { text-align: center; display: grid; gap: 12px; justify-items: center; padding: 40px 16px; }
@media (min-width: 900px) { .gr { grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; } .gr > :first-child { position: sticky; top: 88px; } .cta { position: static; border: none; box-shadow: none; padding: 0; background: none; max-width: 420px; } }
</style>
