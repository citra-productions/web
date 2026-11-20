<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../../components/ui/AppIcon.vue'
import ModalBox from '../../components/ui/ModalBox.vue'
import { state } from '../../stores/store'
import { saveSite } from '../../stores/admin'
import { errMsg } from '../../api/client'
import { normalizeWa, formatPhone } from '../../utils/format'
import { toast } from '../../stores/toast'
const router = useRouter(), s = state.site
// Semua slot wajib terisi saat disimpan (PUT /site-contents mengganti kelimanya sekaligus).
const orig = { whatsapp: formatPhone(s.whatsapp), instagram: s.instagram ? '@' + s.instagram : '', address: s.address, hours: s.hours, about: s.about }
const f = reactive({ ...orig })
const labels = { whatsapp: 'Nomor WhatsApp', instagram: 'Username Instagram', address: 'Alamat lengkap', hours: 'Jam operasional', about: 'Teks tentang kami' }
const errs = reactive({}), confirm = ref(false), busy = ref(false)
const changed = computed(() => Object.keys(orig).filter((k) => f[k].trim() !== orig[k]))
const ig = () => f.instagram.trim().replace(/^@/, '')
function ask() {
  Object.keys(errs).forEach((k) => delete errs[k])
  if (!/^62\d{8,13}$/.test(normalizeWa(f.whatsapp))) errs.whatsapp = 'Nomor WhatsApp tidak valid. Contoh: +62 813-9876-5432'
  if (!/^[A-Za-z0-9._]{1,30}$/.test(ig())) errs.instagram = 'Username hanya huruf, angka, titik, garis bawah (maks. 30).'
  if (!f.address.trim()) errs.address = 'Alamat wajib diisi.'
  if (!f.hours.trim()) errs.hours = 'Jam operasional wajib diisi.'
  if (!f.about.trim()) errs.about = 'Teks tentang kami wajib diisi.'
  if (Object.keys(errs).length) return toast('Periksa kembali isian yang ditandai merah.', 'err')
  if (!changed.value.length) return toast('Belum ada perubahan.', 'err')
  confirm.value = true
}
async function save() {
  busy.value = true
  try {
    await saveSite({ about: f.about.trim(), address: f.address.trim(), operating_hours: f.hours.trim(), whatsapp: normalizeWa(f.whatsapp), instagram: ig() })
    confirm.value = false; router.replace({ name: 'admin-contacts', query: { saved: '1' } })
  } catch (e) { confirm.value = false; toast(errMsg(e), 'err') } finally { busy.value = false }
}
</script>
<template>
  <div class="a-wrap">
    <RouterLink :to="{ name: 'admin-contacts' }" class="bk"><AppIcon name="arrow-left" :size="14" />Kembali ke Kontak</RouterLink>
    <div class="a-head"><h2>Kelola Kontak</h2><span class="a-hint">Lima kolom ini tampil di website dan footer</span></div>
    <form class="card" novalidate @submit.prevent="ask">
      <h3>Info kontak</h3>
      <div class="a-row">
        <div><label class="label first" for="wa">Nomor WhatsApp <span v-if="f.whatsapp.trim() !== orig.whatsapp" class="chg">Diubah</span></label><input id="wa" v-model="f.whatsapp" class="input" :class="{ invalid: errs.whatsapp }" inputmode="tel" /><p v-if="errs.whatsapp" class="err">{{ errs.whatsapp }}</p></div>
        <div><label class="label first" for="ig">Username Instagram <span v-if="f.instagram.trim() !== orig.instagram" class="chg">Diubah</span></label><input id="ig" v-model="f.instagram" class="input" :class="{ invalid: errs.instagram }" placeholder="contoh: @citraproductions" /><p v-if="errs.instagram" class="err">{{ errs.instagram }}</p></div>
      </div>
      <label class="label" for="ad">Alamat lengkap <span v-if="f.address.trim() !== orig.address" class="chg">Diubah</span></label><textarea id="ad" v-model="f.address" class="input" :class="{ invalid: errs.address }" rows="3" maxlength="500" /><p v-if="errs.address" class="err">{{ errs.address }}</p>
      <label class="label" for="oh">Jam operasional <span v-if="f.hours.trim() !== orig.hours" class="chg">Diubah</span></label><input id="oh" v-model="f.hours" class="input" :class="{ invalid: errs.hours }" maxlength="255" placeholder="Senin-Sabtu, 08.00-17.00 WIB" /><p v-if="errs.hours" class="err">{{ errs.hours }}</p>
      <label class="label" for="ab">Teks tentang kami (tampil di hero) <span v-if="f.about.trim() !== orig.about" class="chg">Diubah</span></label><textarea id="ab" v-model="f.about" class="input" :class="{ invalid: errs.about }" rows="4" maxlength="2000" /><p v-if="errs.about" class="err">{{ errs.about }}</p>
      <div class="bar">
        <span class="pend"><i v-if="changed.length" />{{ changed.length ? `${changed.length} perubahan belum disimpan` : 'Belum ada perubahan' }}</span>
        <div class="bt"><RouterLink :to="{ name: 'admin-contacts' }" class="b b--out">Batal</RouterLink><button class="b b--navy">Simpan perubahan</button></div>
      </div>
    </form>
    <ModalBox :open="confirm" title="Simpan perubahan footer/kontak?" subtitle="Perubahan berikut akan langsung tampil di website" icon="edit" width="400px" @close="confirm = false">
      <div class="df"><div v-for="k in changed" :key="k"><small>{{ labels[k] }}</small><p><s>{{ orig[k] || '-' }}</s> → <strong>{{ f[k].trim() || '-' }}</strong></p></div></div>
      <template #footer><button class="b b--out" @click="confirm = false">Periksa lagi</button><button class="b b--navy" :disabled="busy" @click="save">Ya, simpan</button></template>
    </ModalBox>
  </div>
</template>
<style scoped>
.bk { display: inline-flex; gap: 6px; align-items: center; font-size: 11px; color: var(--muted); text-decoration: none; margin-bottom: 8px; } h3 { font-size: 13px; margin-bottom: 8px; }
.label.first { margin-top: 0; } .chg { background: var(--tint); color: var(--navy); font-size: 9px; padding: 1px 6px; border-radius: var(--r-4); margin-left: 4px; font-weight: 500; }
.bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 18px; flex-wrap: wrap; } .pend { font-size: 11px; color: var(--muted); display: inline-flex; gap: 6px; align-items: center; } .pend i { width: 6px; height: 6px; border-radius: 50%; background: var(--navy); } .bt { display: flex; gap: 8px; }
.b { padding: 9px 16px; border-radius: var(--r-6); border: 1px solid transparent; font-size: 12px; font-weight: 600; text-decoration: none; } .b:disabled { opacity: .6; } .b--out { background: #fff; border-color: var(--border); color: var(--text); } .b--navy { background: var(--navy); color: #fff; }
.df { background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--r-8); padding: 10px 12px; display: grid; gap: 8px; } .df small { font-size: 10px; color: var(--muted); } .df p { font-size: 12px; margin: 0; word-break: break-word; } .df s { color: var(--muted); }
</style>
