<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import { state } from '../../stores/store'
import { formatPhone } from '../../utils/format'
const route = useRoute()
const rows = computed(() => [
  { icon: 'chat', title: 'WhatsApp', sub: formatPhone(state.site.whatsapp) },
  { icon: 'map-pin', title: 'Alamat', sub: state.site.address },
  { icon: 'clock', title: 'Jam operasional', sub: state.site.hours },
  { icon: 'instagram', title: 'Instagram', sub: state.site.instagram ? '@' + state.site.instagram : '' },
  { icon: 'list', title: 'Tentang kami', sub: state.site.about },
].filter((r) => r.sub))
</script>
<template>
  <section id="kontak" class="a-section">
    <p v-if="route.query.saved" class="ok" role="status"><AppIcon name="check" :size="14" />Perubahan footer/kontak berhasil disimpan</p>
    <div class="a-head"><h2>Kelola Kontak</h2><span class="a-hint">Info kontak dan teks tentang kami</span></div>
    <RouterLink :to="{ name: 'admin-contacts-edit' }" class="eb">Edit kontak</RouterLink>
    <div class="card">
      <p v-if="!rows.length" class="muted emp">Data kontak belum diisi. Lengkapi lewat tombol Edit kontak.</p>
      <RouterLink v-for="r in rows" :key="r.title" :to="{ name: 'admin-contacts-edit' }" class="rw">
        <span class="ic"><AppIcon :name="r.icon" :size="16" /></span><span class="tx"><strong>{{ r.title }}</strong><small>{{ r.sub }}</small></span><AppIcon name="chevron-right" :size="16" />
      </RouterLink>
    </div>
  </section>
</template>
<style scoped>
.ok { display: flex; gap: 8px; align-items: center; background: #EAF6EC; border: 1px solid #A8DDB5; color: #1E6B34; border-radius: var(--r-6); padding: 8px 12px; font-size: 12px; margin-bottom: 14px; }
.eb { display: inline-flex; background: var(--navy); color: #fff; text-decoration: none; font-size: 12px; font-weight: 600; padding: 9px 16px; border-radius: var(--r-6); margin-bottom: 12px; }
.card { padding: 4px 14px; }
.emp { padding: 14px 0; font-size: 13px; }
.rw { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; }
.rw:last-child { border-bottom: none; } .rw:hover { color: var(--navy); }
.ic { width: 32px; height: 32px; border-radius: 50%; background: var(--tint); color: var(--navy); display: flex; align-items: center; justify-content: center; flex-shrink: 0; } .tx { flex: 1; display: grid; min-width: 0; } .tx strong { font-size: 13px; } .tx small { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
