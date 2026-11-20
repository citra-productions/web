<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import KebabMenu from '../ui/KebabMenu.vue'
import ActionConfirm from '../ui/ActionConfirm.vue'
import PaginationBar from '../ui/PaginationBar.vue'
import { adm, setProductPublished, removeProduct } from '../../stores/admin'
import { errMsg } from '../../api/client'
import { priceLabel } from '../../utils/format'
import { toast } from '../../stores/toast'
const router = useRouter()
const page = ref(1), del = ref(null)
const per = 8, total = computed(() => Math.max(1, Math.ceil(adm.products.length / per)))
const paged = computed(() => adm.products.slice((page.value - 1) * per, page.value * per))
watch(total, (t) => { if (page.value > t) page.value = t })
const catName = (id) => adm.categories.find((c) => c.id === id)?.title || 'Tanpa kategori'
const price = (p) => priceLabel({ priceMin: p.price_min, priceMax: p.price_max })
const menuFor = (p) => [{ label: 'edit produk', icon: 'edit' }, { label: p.is_published ? 'jadikan draft' : 'tayangkan di katalog', icon: p.is_published ? 'eye-off' : 'eye' }, { label: 'hapus produk', icon: 'trash', danger: true }]
async function onMenu(i, p) {
  try {
    if (i === 0) router.push({ name: 'admin-product-edit', params: { id: p.id } })
    else if (i === 1) {
      const next = !p.is_published
      await setProductPublished(p.id, next)
      toast(next ? 'Produk ditampilkan di katalog.' : 'Produk disembunyikan dari katalog.')
    }
    else del.value = p
  } catch (e) { toast(errMsg(e), 'err') }
}
async function confirmDel() { try { await removeProduct(del.value.id); toast('Produk dihapus.') } catch (e) { toast(errMsg(e), 'err') } del.value = null }
</script>
<template>
  <section id="produk" class="a-section">
    <div class="a-head"><h2>Kelola Produk</h2></div>
    <div class="card add">
      <div class="a-head"><h3>Tambah Produk</h3><span class="a-hint">Form input produk</span></div>
      <BaseButton as="RouterLink" :to="{ name: 'admin-product-new' }" block class="nb"><template #icon><AppIcon name="plus" :size="16" /></template>tambah produk baru</BaseButton>
    </div>

    <h3 class="lh">Daftar Produk ({{ adm.products.length }} item)</h3>
    <p v-if="!adm.products.length" class="muted emp">Belum ada produk. Tambahkan produk pertama lewat formulir di atas.</p>
    <div class="gr">
      <article v-for="p in paged" :key="p.id" class="pc" :class="{ off: !p.is_published }">
        <div class="im">
          <img v-if="p.photos[0]" :src="p.photos[0].src" :alt="p.photos[0].alt_text" /><div v-else class="ph"><AppIcon name="image" :size="22" /></div>
          <div class="km"><KebabMenu :items="menuFor(p)" dark :label="`Menu ${p.title}`" @select="onMenu($event, p)" /></div>
          <span v-if="!p.is_published" class="hid badge badge--off">Draft</span>
        </div>
        <p class="ct">{{ catName(p.category_id) }}</p>
        <h4>{{ p.title }}</h4>
        <p class="pr">{{ price(p) }}</p>
      </article>
    </div>
    <PaginationBar v-model:page="page" :total="total" />
    <ActionConfirm :open="!!del" title="Hapus produk ini?" message="Produk beserta foto dan pilihan packagingnya dihapus permanen. Testimoni yang menandai produk ini tetap ada." item-label="Produk" :item-text="del?.title" @confirm="confirmDel" @cancel="del = null" />
  </section>
</template>
<style scoped>
h3 { font-size: 16px; } .add { display: grid; gap: 10px; margin-bottom: 20px; padding: 12px; } .add .a-head { margin: 0; }
.lh { font-size: 15px; font-weight: 500; margin-bottom: 10px; } .emp { padding: 12px 0; font-size: 14px; }
.gr { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
.pc { background: #fff; border: 1px solid var(--border); border-radius: var(--r-8); padding: 6px 6px 10px; } .pc.off { background: var(--bg-soft); }
.im { position: relative; aspect-ratio: 1 / 1; border-radius: var(--r-6); overflow: hidden; background: var(--tint); margin-bottom: 6px; } .pc.off .im img { opacity: .45; } .im img, .ph { width: 100%; height: 100%; object-fit: cover; } .ph { display: flex; align-items: center; justify-content: center; color: var(--muted); }
.km { position: absolute; top: 6px; right: 6px; } .hid { position: absolute; left: 6px; bottom: 6px; background: #fff; }
.ct { font-size: 11px; color: var(--muted); padding: 0 2px; } h4 { font-size: 14px; font-weight: 700; padding: 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pr { font-size: 11px; font-weight: 700; color: var(--navy); padding: 0 2px; }
@media (min-width: 720px) { .gr { grid-template-columns: repeat(4, 1fr); } }
.nb { border-radius: var(--r-8); }
</style>
