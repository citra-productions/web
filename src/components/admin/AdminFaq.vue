<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import ModalBox from '../ui/ModalBox.vue'
import TabsBar from '../ui/TabsBar.vue'
import ActionConfirm from '../ui/ActionConfirm.vue'
import { adm, patchFaq, removeFaq, createFaq } from '../../stores/admin'
import { errMsg } from '../../api/client'
import { toast } from '../../stores/toast'
// Status dari API: pending → published | rejected; published ↔ withdrawn (disembunyikan). rejected tidak bisa diubah lagi.
const live = computed(() => adm.faqs.filter((f) => f.status === 'published' || f.status === 'withdrawn'))
const pending = computed(() => adm.faqs.filter((f) => f.status === 'pending'))
const rejected = computed(() => adm.faqs.filter((f) => f.status === 'rejected'))
const tab = ref('live')
const tabs = computed(() => [{ key: 'live', label: 'FAQ Tayang', count: live.value.length }, { key: 'pending', label: 'Pertanyaan Masuk', count: pending.value.length }, { key: 'rejected', label: 'Ditolak', count: rejected.value.length }])
const ans = ref(null), answer = ref(''), err = ref(''), hide = ref(null), del = ref(null), busy = ref(false)
const add = ref(false), nq = ref(''), na = ref('')
const MAX = 300
function openAnswer(f, editing = false) { ans.value = { f, editing }; answer.value = f.answer || ''; err.value = '' }
async function run(fn, okMsg) { busy.value = true; try { await fn(); if (okMsg) toast(okMsg); return true } catch (e) { toast(errMsg(e), 'err'); return false } finally { busy.value = false } }
async function publish() {
  if (answer.value.trim().length < 3) { err.value = 'Jawaban wajib diisi.'; return }
  const { f, editing } = ans.value
  const body = editing ? { answer: answer.value.trim() } : { answer: answer.value.trim(), status: 'published' }
  if (await run(() => patchFaq(f.id, body), editing ? 'Jawaban diperbarui.' : 'Pertanyaan disetujui dan tampil di FAQ.')) ans.value = null
}
async function reject(f) { if (await run(() => patchFaq(f.id, { status: 'rejected' }), 'Pertanyaan ditolak.')) ans.value = null }
async function doHide() { await run(() => patchFaq(hide.value.id, { status: 'withdrawn' }), 'FAQ disembunyikan dari website.'); hide.value = null }
async function show(f) { await run(() => patchFaq(f.id, { status: 'published' }), 'FAQ ditampilkan kembali.') }
// FAQ yang masih tayang harus ditarik dulu; API menolak hapus langsung untuk status published.
async function doDel() {
  const f = del.value; if (!f) return
  await run(async () => {
    if (f.status === 'published') await patchFaq(f.id, { status: 'withdrawn' })
    await removeFaq(f.id)
  }, 'FAQ dihapus.')
  del.value = null
}
async function create() {
  if (nq.value.trim().length < 5 || na.value.trim().length < 3) { err.value = 'Isi pertanyaan dan jawaban.'; return }
  if (await run(() => createFaq({ question: nq.value.trim(), answer: na.value.trim() }), 'FAQ ditambahkan.')) { add.value = false; nq.value = ''; na.value = '' }
}
</script>
<template>
  <section id="faq" class="a-section">
    <div class="a-head"><h2>Kelola FAQ</h2></div>
    <TabsBar v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'live'">
      <div class="hd"><h3>Daftar FAQ ({{ live.length }} item)</h3></div>
            <p v-if="!live.length" class="muted emp">Belum ada FAQ yang tayang.</p>
      <article v-for="f in live" :key="f.id" class="fq" :class="{ off: f.status === 'withdrawn' }">
        <span class="badge" :class="f.status === 'withdrawn' ? 'badge--mute' : 'badge--on'">{{ f.status === 'withdrawn' ? 'Disembunyikan' : 'Tayang' }}</span>
        <p class="q">{{ f.question }}</p><p class="an">{{ f.answer }}</p>
        <div class="ac">
          <button v-if="f.status === 'published'" class="bt bt--navy-o" @click="hide = f"><AppIcon name="eye-off" :size="14" />Sembunyikan</button>
          <button v-else class="bt bt--navy-o" @click="show(f)"><AppIcon name="eye" :size="14" />Tampilkan</button>
          <button class="bt bt--red-o" @click="del = f"><AppIcon name="trash" :size="14" />Hapus</button>
        </div>
      </article>
    </template>

    <template v-else-if="tab === 'pending'">
      <h3>Menunggu Persetujuan ({{ pending.length }} item)</h3>
      <p v-if="!pending.length" class="muted emp">Tidak ada pertanyaan yang menunggu.</p>
      <div class="gd">
        <article v-for="f in pending" :key="f.id" class="cd">
          <div class="who"><span class="av">A</span><strong>{{ f.source === 'admin' ? 'Admin' : 'Anonim' }}</strong><span class="badge badge--warn">Status Pending</span></div>
          <p class="q">{{ f.question }}</p>
          <div class="ac2"><button class="bt bt--red-o" :disabled="busy" @click="reject(f)">Tolak</button><button class="bt bt--navy" @click="openAnswer(f)">Jawab</button></div>
        </article>
      </div>
    </template>

    <template v-else>
      <h3>Pertanyaan Ditolak ({{ rejected.length }} item)</h3>
            <p v-if="!rejected.length" class="muted emp">Tidak ada pertanyaan yang ditolak.</p>
      <div class="gd">
        <article v-for="f in rejected" :key="f.id" class="cd cd--off">
          <div class="who"><span class="av">A</span><strong>{{ f.source === 'admin' ? 'Admin' : 'Anonim' }}</strong></div>
          <p class="q q--mute">{{ f.question }}</p><span class="badge badge--off">● Ditolak</span>
          <div class="ac2"><button class="bt bt--red-o" aria-label="Hapus permanen" @click="del = f"><AppIcon name="trash" :size="14" />Hapus</button></div>
        </article>
      </div>
    </template>

    <ModalBox :open="!!ans" :title="ans?.editing ? 'Ubah Jawaban' : 'Jawab Pertanyaan'" width="460px" @close="ans = null">
      <div v-if="ans" class="qb"><small>Pertanyaan dari {{ ans.f.source === 'admin' ? 'Admin' : 'Anonim' }}<span v-if="!ans.editing" class="badge badge--warn">Status Pending</span></small><strong>{{ ans.f.question }}</strong></div>
      <label class="label" for="jw">Jawaban</label>
      <textarea id="jw" v-model="answer" class="input" :class="{ invalid: err }" rows="4" :maxlength="MAX" placeholder="Tulis jawaban yang akan tampil di FAQ" />
      <p class="ctr">{{ answer.length }} dari {{ MAX }} karakter</p><p v-if="err" class="err">{{ err }}</p>
      <template #footer>
        <button v-if="ans && !ans.editing" class="bt bt--red-o mr" :disabled="busy" @click="reject(ans.f)">✕ Tolak</button>
        <button class="bt bt--out" @click="ans = null">Batal</button>
        <button class="bt bt--green" :disabled="busy" @click="publish"><AppIcon name="check" :size="14" />{{ ans?.editing ? 'Simpan' : 'Setujui & Tayangkan' }}</button>
      </template>
    </ModalBox>
    <ModalBox :open="add" title="Tambah FAQ" subtitle="FAQ yang ditambahkan langsung tayang di website." width="460px" @close="add = false">
      <label class="label first" for="nq">Pertanyaan</label><input id="nq" v-model="nq" class="input" maxlength="500" />
      <label class="label" for="na">Jawaban</label><textarea id="na" v-model="na" class="input" rows="4" maxlength="2000" />
      <p v-if="err" class="err">{{ err }}</p>
      <template #footer><button class="bt bt--out" @click="add = false">Batal</button><button class="bt bt--green" :disabled="busy" @click="create">Simpan & Tayangkan</button></template>
    </ModalBox>
    <ActionConfirm :open="!!hide" title="Sembunyikan FAQ ini?" message="FAQ tidak akan tampil di halaman publik, tetapi tetap tersimpan dan bisa ditampilkan kembali kapan saja." item-label="FAQ yang dipilih" :item-text="hide?.question" icon="eye-off" tone="primary" confirm-label="Ya, Sembunyikan" @confirm="doHide" @cancel="hide = null" />
    <ActionConfirm :open="!!del" :title="del?.status === 'published' ? 'Tarik lalu hapus FAQ ini?' : 'Hapus FAQ ini?'" :message="del?.status === 'published' ? 'FAQ masih tayang. Saat dikonfirmasi, FAQ akan ditarik dari halaman publik lebih dulu, lalu dihapus permanen. Setelah dihapus tidak bisa dikembalikan.' : 'FAQ akan dihapus permanen dan tidak bisa dikembalikan.'" item-label="FAQ yang dipilih" :item-text="del?.question" @confirm="doDel" @cancel="del = null" />
  </section>
</template>
<style scoped>
h3 { font-size: 14px; font-weight: 500; margin-bottom: 4px; } .hd { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 4px; } .nt { font-size: 11px; margin-bottom: 10px; } .emp { font-size: 13px; padding: 6px 0; }
.fq { background: #fff; border: 1px solid var(--border); border-radius: var(--r-8); padding: 12px; margin-bottom: 10px; display: grid; gap: 6px; } .fq .badge { justify-self: start; } .fq.off { background: var(--bg-soft); }
.q { font-size: 13px; font-weight: 700; } .q--mute { font-weight: 400; color: var(--muted); } .an { font-size: 12px; color: var(--muted); }
.ac { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px; } .ac2 { display: flex; gap: 8px; } .ac2 .bt { flex: 1; justify-content: center; }
.gd { display: grid; gap: 10px; } .cd { background: #fff; border: 1px solid var(--border); border-radius: var(--r-8); padding: 12px; display: grid; gap: 8px; align-content: start; } .cd--off { background: var(--bg-soft); } .cd--off .badge { justify-self: start; }
.who { display: flex; align-items: center; gap: 6px; font-size: 12px; flex-wrap: wrap; } .who .badge { margin-left: auto; } .av { width: 18px; height: 18px; border-radius: 50%; background: #E7E8EB; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
.badge--warn { background: #FFF4E5; color: #B45309; border-color: #F5C98B; } .badge--mute { background: var(--bg-soft); color: var(--muted); border-color: var(--border); }
.bt { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: var(--r-6); border: 1px solid transparent; font-size: 12px; font-weight: 600; background: #fff; } .bt:disabled { opacity: .6; }
.bt--ghost { border-color: var(--border); color: var(--text); } .bt--out { border-color: var(--border); } .bt--navy { background: var(--navy); color: #fff; } .bt--navy-o { border-color: var(--navy); color: var(--navy); } .bt--red-o { border-color: var(--red); color: var(--red); } .bt--green { background: #4D8C1A; color: #fff; } .mr { margin-right: auto; }
.qb { background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--r-8); padding: 10px 12px; display: grid; gap: 4px; } .qb small { font-size: 11px; color: var(--muted); display: flex; justify-content: space-between; align-items: center; } .qb strong { font-size: 13px; }
.label { margin-top: 14px; } .label.first { margin-top: 0; } .ctr { font-size: 10px; color: var(--muted); text-align: right; margin: 4px 0 0; }
@media (min-width: 720px) { .gd { grid-template-columns: repeat(3, 1fr); } }
</style>
