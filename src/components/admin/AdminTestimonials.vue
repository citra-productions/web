<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import TabsBar from '../ui/TabsBar.vue'
import ActionConfirm from '../ui/ActionConfirm.vue'
import { adm, patchTestimony, removeTestimony } from '../../stores/admin'
import { errMsg } from '../../api/client'
import { toast } from '../../stores/toast'
const live = computed(() => adm.testimonies.filter((t) => t.status === 'published' || t.status === 'withdrawn'))
const pending = computed(() => adm.testimonies.filter((t) => t.status === 'pending'))
const rejected = computed(() => adm.testimonies.filter((t) => t.status === 'rejected'))
const tab = ref('live')
const tabs = computed(() => [{ key: 'live', label: 'Testimoni Tayang', count: live.value.length }, { key: 'pending', label: 'Menunggu Persetujuan', count: pending.value.length }, { key: 'rejected', label: 'Ditolak', count: rejected.value.length }])
const hide = ref(null), del = ref(null), busy = ref(false)
const productName = (id) => adm.products.find((p) => p.id === id)?.title || ''
async function run(fn, okMsg) { busy.value = true; try { await fn(); toast(okMsg) } catch (e) { toast(errMsg(e), 'err') } finally { busy.value = false } }
const setStatus = (t, status, msg) => run(() => patchTestimony(t.id, { status }), msg)
async function doHide() { await setStatus(hide.value, 'withdrawn', 'Testimoni disembunyikan dari website.'); hide.value = null }
// Testimoni yang masih tayang harus ditarik dulu; API menolak hapus langsung untuk status published.
async function doDel() {
  const t = del.value; if (!t) return
  await run(async () => {
    if (t.status === 'published') await patchTestimony(t.id, { status: 'withdrawn' })
    await removeTestimony(t.id)
  }, 'Testimoni dihapus.')
  del.value = null
}
</script>
<template>
  <section id="testimoni" class="a-section">
    <div class="a-head"><h2>Kelola Testimoni</h2><span class="a-hint">Moderasi testimoni dari pengunjung</span></div>
    <TabsBar v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'live'">
      <div class="hd"><h3>Daftar Testimoni ({{ live.length }} item)</h3></div>
      <p v-if="!live.length" class="muted emp">Belum ada testimoni yang tayang. Testimoni baru muncul di tab Menunggu Persetujuan.</p>
      <div class="live-list">
        <article v-for="t in live" :key="t.id" class="cd" :class="{ 'cd--off': t.status === 'withdrawn' }">
          <div class="who"><span class="av">{{ t.author_name.charAt(0) }}</span><strong>{{ t.author_name }}</strong></div>
          <p class="tx">{{ t.content }}</p>
          <div class="row"><span class="badge" :class="t.status === 'withdrawn' ? 'badge--mute' : 'badge--on'">● {{ t.status === 'withdrawn' ? 'Disembunyikan' : 'Tayang' }}</span><span class="lk"><AppIcon name="thumbs-up" :size="12" />{{ t.upvote_count }}</span></div>
          <div class="ac2">
            <button v-if="t.status === 'published'" class="bt bt--navy-o grow" :disabled="busy" @click="hide = t"><AppIcon name="eye-off" :size="14" />Sembunyikan</button>
            <button v-else class="bt bt--navy-o grow" :disabled="busy" @click="setStatus(t, 'published', 'Testimoni ditampilkan kembali.')"><AppIcon name="eye" :size="14" />Tampilkan</button>
            <button class="bt bt--red-o" :aria-label="`Hapus testimoni ${t.author_name}`" @click="del = t"><AppIcon name="trash" :size="14" /></button>
          </div>
        </article>
      </div>
    </template>

    <template v-else-if="tab === 'pending'">
      <h3>Menunggu Persetujuan ({{ pending.length }} item)</h3>
      <p v-if="!pending.length" class="muted emp">Tidak ada testimoni yang menunggu.</p>
      <div class="gd">
        <article v-for="t in pending" :key="t.id" class="cd">
          <div class="who"><span class="av">{{ t.author_name.charAt(0) }}</span><strong>{{ t.author_name }}</strong></div>
          <p class="tx">{{ t.content }}</p>
          <span class="badge badge--warn">Status Pending</span>
          <div class="ac2"><button class="bt bt--red-o" :disabled="busy" @click="setStatus(t, 'rejected', 'Testimoni ditolak.')">✕ Tolak</button><button class="bt bt--green" :disabled="busy" @click="setStatus(t, 'published', 'Testimoni disetujui dan tampil.')"><AppIcon name="check" :size="14" />Setujui</button></div>
        </article>
      </div>
    </template>

    <template v-else>
      <h3>Testimoni Ditolak ({{ rejected.length }} item)</h3>
      <p v-if="!rejected.length" class="muted emp">Tidak ada testimoni yang ditolak.</p>
      <div class="gd">
        <article v-for="t in rejected" :key="t.id" class="cd cd--off">
          <div class="who"><span class="av">{{ t.author_name.charAt(0) }}</span><strong>{{ t.author_name }}</strong></div>
          <p class="tx tx--mute">{{ t.content }}</p><span class="badge badge--off">● Ditolak</span>
          <div class="ac2"><button class="bt bt--red-o" aria-label="Hapus permanen" @click="del = t"><AppIcon name="trash" :size="14" />Hapus</button></div>
        </article>
      </div>
    </template>

    <ActionConfirm :open="!!hide" title="Sembunyikan testimoni ini?" message="Testimoni tidak akan tampil di halaman publik, tetapi tetap tersimpan dan bisa ditampilkan kembali kapan saja." :item-label="`Testimoni dari ${hide?.author_name}`" :item-text="hide?.content" icon="eye-off" tone="primary" confirm-label="Ya, Sembunyikan" @confirm="doHide" @cancel="hide = null" />
    <ActionConfirm :open="!!del" :title="del?.status === 'published' ? 'Tarik lalu hapus testimoni ini?' : 'Hapus testimoni ini?'" :message="del?.status === 'published' ? 'Testimoni masih tayang. Saat dikonfirmasi, testimoni akan ditarik dari halaman publik lebih dulu, lalu dihapus permanen beserta dukungannya. Setelah dihapus tidak bisa dikembalikan.' : 'Testimoni akan dihapus permanen beserta dukungannya dan tidak bisa dikembalikan.'" :item-label="`Testimoni dari ${del?.author_name}`" :item-text="del?.content" @confirm="doDel" @cancel="del = null" />
  </section>
</template>
<style scoped>
h3 { font-size: 14px; font-weight: 500; margin-bottom: 4px; } .hd { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 4px; } .nt { font-size: 11px; margin-bottom: 10px; } .emp { font-size: 13px; padding: 6px 0; }
.gd { display: grid; gap: 10px; } .live-list { display: grid; gap: 10px; } .cd { background: #fff; border: 1px solid var(--border); border-radius: var(--r-8); padding: 12px; display: grid; gap: 8px; align-content: start; } .cd--off { background: var(--bg-soft); }
.who { display: flex; align-items: center; gap: 6px; font-size: 12px; } .av { width: 18px; height: 18px; border-radius: 50%; background: #E7E8EB; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
.tx { font-size: 12px; color: #3a4150; } .tx--mute { color: var(--muted); } .row { display: flex; justify-content: space-between; align-items: center; } .lk { display: inline-flex; gap: 4px; align-items: center; font-size: 11px; color: var(--muted); }
.pt { font-size: 10px; color: var(--navy); background: var(--tint); border-radius: var(--r-4); padding: 1px 8px; justify-self: start; }
.badge--warn { background: #FFF4E5; color: #B45309; border-color: #F5C98B; justify-self: start; } .badge--mute { background: #fff; color: var(--muted); border-color: var(--border); } .badge--off { justify-self: start; }
.ac2 { display: flex; gap: 8px; } .ac2 .bt { flex: 1; justify-content: center; } .ac2 .bt[aria-label^="Hapus testimoni"] { flex: 0 0 auto; } .grow { flex: 1; }
.bt { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: var(--r-6); border: 1px solid transparent; font-size: 12px; font-weight: 600; background: #fff; } .bt:disabled { opacity: .6; }
.bt--navy-o { border-color: var(--navy); color: var(--navy); } .bt--red-o { border-color: var(--red); color: var(--red); } .bt--green { background: #4D8C1A; color: #fff; }
@media (min-width: 720px) { .gd { grid-template-columns: repeat(3, 1fr); } }
</style>
