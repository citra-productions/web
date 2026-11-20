<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import KebabMenu from '../ui/KebabMenu.vue'
import { coverOf } from '../../stores/store'
import { priceLabel } from '../../utils/format'
import { toast } from '../../stores/toast'
import { useWhatsapp } from '../../composables/useWhatsapp'
const props = defineProps({ product: { type: Object, required: true }, layout: { type: String, default: 'list' } })
const router = useRouter(); const { waLink } = useWhatsapp()
const cover = computed(() => coverOf(props.product))
const to = computed(() => ({ name: 'product', params: { id: props.product.id } }))
const menu = [{ label: 'Lihat detail', icon: 'list' }, { label: 'Tanya via WhatsApp', icon: 'chat' }, { label: 'Bagikan', icon: 'share' }]
async function onMenu(i) {
  const p = props.product
  if (i === 0) router.push(to.value)
  else if (i === 1) window.open(waLink(`Halo, saya tertarik dengan "${p.name}" (${priceLabel(p)}). Boleh minta info dan penawaran?`), '_blank', 'noopener')
  else {
    const url = location.origin + location.pathname + router.resolve(to.value).href
    try { if (navigator.share) await navigator.share({ title: p.name, url }); else { await navigator.clipboard.writeText(url); toast('Tautan produk disalin.') } } catch (e) { if (e?.name !== 'AbortError') toast('Tidak bisa membagikan.', 'err') }
  }
}
</script>
<template>
  <article class="pc" :class="`pc--${layout}`">
    <RouterLink :to="to" class="lk" :aria-label="`${product.name}, ${priceLabel(product)}`">
      <div class="im">
        <img v-if="cover" :src="cover.src" :alt="cover.alt || product.name" loading="lazy" />
        <span v-if="product.featured && layout === 'grid'" class="fb"><AppIcon name="star" :size="10" />Pilihan</span>
        <div v-else class="ph"><AppIcon name="image" :size="22" /></div>
      </div>
      <div class="bd">
        <p class="ct">{{ product.categoryName }}</p>
        <h3>{{ product.name }}</h3>
        <p class="pr">{{ priceLabel(product) }}</p>
      </div>
    </RouterLink>
    <div class="km"><KebabMenu :items="menu" :label="`Menu ${product.name}`" :dark="layout === 'grid'" align="right" @select="onMenu" /></div>
  </article>
</template>
<style scoped>
.pc { position: relative; background: #fff; border: 1px solid var(--border); border-radius: var(--r-8); transition: box-shadow .15s, border-color .15s; } .pc:hover { box-shadow: var(--sh-md); border-color: #C9D2E6; }
.lk { display: flex; align-items: center; gap: 12px; padding: 10px 44px 10px 10px; text-decoration: none; color: inherit; }
.im { width: 64px; height: 64px; flex-shrink: 0; border-radius: var(--r-6); overflow: hidden; background: var(--tint); } .im img, .ph { width: 100%; height: 100%; object-fit: cover; } .ph { display: flex; align-items: center; justify-content: center; color: var(--muted); }
.bd { flex: 1; min-width: 0; } .ct { font-size: 11px; color: var(--muted); } h3 { font-size: 15px; font-weight: 700; margin: 1px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pr { font-size: 12px; font-weight: 700; color: var(--navy); }
.km { position: absolute; top: 50%; right: 6px; transform: translateY(-50%); }
.pc--grid .lk { flex-direction: column; align-items: stretch; gap: 6px; padding: 6px 6px 10px; } .pc--grid .im { width: 100%; height: auto; aspect-ratio: 1 / 1; position: relative; }
.pc--grid .km { top: 10px; right: 10px; transform: none; } .pc--grid .bd { padding: 0 2px; }
.fb { position: absolute; left: 6px; top: 6px; display: inline-flex; align-items: center; gap: 3px; background: var(--navy); color: #fff; font-size: 10px; line-height: 16px; padding: 1px 6px; border-radius: var(--r-4); }
</style>
