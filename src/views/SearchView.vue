<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/ui/AppIcon.vue'
import ProductCard from '../components/sections/ProductCard.vue'
import { state } from '../stores/store'
const router = useRouter()
const RK = 'citra-recent-search'
const load = () => { try { return JSON.parse(localStorage.getItem(RK) || '[]') } catch { return [] } }
const recent = ref(load()), q = ref(''), input = ref(null), focused = ref(true)
const save = () => { try { localStorage.setItem(RK, JSON.stringify(recent.value)) } catch {} }
function commit(text = q.value) {
  const t = text.trim(); if (!t) return
  recent.value = [t, ...recent.value.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5); save()
}
const pick = (t) => { q.value = t; commit(t); focused.value = false }
const clear = () => { recent.value = []; save() }
const results = computed(() => {
  const s = q.value.trim().toLowerCase(); if (!s) return []
  return state.products.filter((p) => p.name.toLowerCase().includes(s) || p.categoryName.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
})
const back = () => (window.history.length > 1 ? router.back() : router.push({ name: 'catalog' }))
onMounted(() => input.value?.focus())
</script>
<template>
  <div class="container sv">
    <form class="top" role="search" @submit.prevent="commit(); focused = false">
      <button type="button" class="bk" aria-label="Kembali" @click="back"><AppIcon name="arrow-left" :size="20" /></button>
      <input ref="input" v-model="q" class="input" type="search" placeholder="Cari produk atau kategori…" aria-label="Cari produk atau kategori" @focus="focused = true" />
    </form>
    <p class="lb">Pencarian terakhir</p>
    <div v-if="focused && !q.trim()" class="rc">
      <p v-if="!recent.length" class="muted em">Belum ada pencarian.</p>
      <button v-for="r in recent" :key="r" class="ri" @click="pick(r)"><AppIcon name="clock" :size="16" />{{ r }}</button>
      <button v-if="recent.length" class="cl" @click="clear">Hapus riwayat</button>
    </div>
    <template v-if="q.trim()">
      <p class="lb">{{ results.length }} hasil untuk “{{ q.trim() }}”</p>
      <div v-if="results.length" class="gr"><ProductCard v-for="p in results" :key="p.id" :product="p" layout="grid" @click.capture="commit()" /></div>
      <div v-else class="empty"><p>Produk yang kamu cari belum ada di katalog.</p></div>
    </template>
    <template v-else-if="!focused"><div class="gr"><ProductCard v-for="p in state.products.slice(0, 8)" :key="p.id" :product="p" layout="grid" /></div></template>
  </div>
</template>
<style scoped>
.sv { padding-top: 18px; padding-bottom: 40px; min-height: 60vh; } .top { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; } .bk { border: none; background: none; padding: 6px; display: flex; }
.lb { font-size: 11px; color: var(--muted); margin: 8px 0; } .rc { background: #D6D6D6; border-radius: var(--r-8); padding: 6px 4px; margin-bottom: 16px; }
.ri { display: flex; gap: 10px; align-items: center; width: 100%; padding: 8px 10px; background: none; border: none; text-align: left; font-size: 13px; color: #444; } .ri:hover { background: rgba(0,0,0,.06); }
.cl { background: none; border: none; color: var(--navy); font-size: 12px; font-weight: 600; padding: 6px 10px; } .em { padding: 8px 10px; font-size: 13px; }
.gr { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; } .empty { text-align: center; padding: 32px 8px; color: var(--muted); font-size: 14px; }
@media (min-width: 700px) { .gr { grid-template-columns: repeat(4, 1fr); } }
</style>
