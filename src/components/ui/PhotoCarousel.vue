<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { useSwipe } from '../../composables/useSwipe'
// `photos` = [{ src, alt }]. Alt dibaca per foto supaya tiap gambar punya deskripsi sendiri.
const props = defineProps({ photos: { type: Array, default: () => [] }, alt: { type: String, default: '' }, label: { type: String, default: '' } })
const i = ref(0)
const n = computed(() => props.photos.length)
watch(n, () => { i.value = 0 })
const next = () => { if (n.value) i.value = (i.value + 1) % n.value }
const prev = () => { if (n.value) i.value = (i.value - 1 + n.value) % n.value }
const swipe = useSwipe(next, prev)
const altOf = (k) => props.photos[k]?.alt || `${props.alt || props.label || 'Foto'} (foto ${k + 1} dari ${n.value})`
</script>
<template>
  <div class="pc">
    <div class="main" v-on="swipe">
      <img v-if="n" :src="photos[i].src" :alt="altOf(i)" />
      <div v-else class="ph empty"><AppIcon name="image" :size="40" /></div>
      <span v-if="n" class="cnt">{{ i + 1 }}/{{ n }} {{ label.toLowerCase() }}</span>
      <template v-if="n > 1">
        <button class="nav l" aria-label="Foto sebelumnya" @click="prev"><AppIcon name="chevron-left" :size="20" /></button>
        <button class="nav r" aria-label="Foto berikutnya" @click="next"><AppIcon name="chevron-right" :size="20" /></button>
      </template>
    </div>
    <div v-if="n > 1" class="th">
      <button v-for="(p, k) in photos" :key="p.id || k" class="t" :class="{ on: k === i }" :aria-label="`Lihat foto ${k + 1}`" @click="i = k"><img :src="p.src" alt="" /></button>
    </div>
  </div>
</template>
<style scoped>
.main { position: relative; aspect-ratio: 1 / 1; border-radius: var(--r-16); overflow: hidden; background: var(--tint); touch-action: pan-y; }
.main img { width: 100%; height: 100%; object-fit: cover; } .empty { width: 100%; height: 100%; }
.cnt { position: absolute; left: 12px; bottom: 12px; background: rgba(255,255,255,.92); color: var(--text); font-size: 12px; padding: 2px 12px; border-radius: var(--r-4); }
.nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: var(--r-full); border: none; background: rgba(255,255,255,.9); display: flex; align-items: center; justify-content: center; box-shadow: var(--sh-md); }
.l { left: 10px; } .r { right: 10px; }
.th { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; padding-bottom: 2px; }
.t { flex: 0 0 auto; width: 58px; height: 58px; padding: 0; border-radius: var(--r-6); overflow: hidden; border: 2px solid transparent; background: var(--tint); } .t img { width: 100%; height: 100%; object-fit: cover; } .t.on { border-color: var(--navy); }
</style>
