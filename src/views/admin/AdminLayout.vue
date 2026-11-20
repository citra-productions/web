<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LogoMark from '../../components/ui/LogoMark.vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import SideDrawer from '../../components/ui/SideDrawer.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { adminLinks } from '../../config/nav'
import { adm, loadAdmin, resetAdmin } from '../../stores/admin'
import { logout } from '../../stores/auth'
const router = useRouter(); const open = ref(false)
const links = computed(() => adminLinks.map((l) => ({ ...l, badge: '' })))
onMounted(() => loadAdmin())
async function out() { open.value = false; await logout(); resetAdmin(); router.replace({ name: 'admin-login' }) }
</script>
<template>
  <header class="hd">
    <div class="a-wrap in">
      <RouterLink :to="{ name: 'admin' }" class="brand" aria-label="Dashboard admin"><LogoMark :size="30" /><span class="n">Citra</span><span class="s">Productions</span><span class="badge badge--on">admin</span></RouterLink>
      <nav class="dk" aria-label="Navigasi admin">
        <RouterLink v-for="l in links" :key="l.label" :to="l.to" :exact-active-class="l.exact ? 'on' : ''" :active-class="l.exact ? '' : 'on'">{{ l.label }}<span v-if="l.badge" class="bg">{{ l.badge }}</span></RouterLink>
      </nav>
      <div class="dka">
        <RouterLink :to="{ name: 'home' }" class="vt"><AppIcon name="link" :size="14" />Lihat website</RouterLink>
        <button class="lo" @click="out"><AppIcon name="logout" :size="14" />Keluar</button>
      </div>
      <button class="icon-btn mn" aria-label="Buka menu admin" @click="open = true"><AppIcon name="menu" :size="22" /></button>
    </div>
    <SideDrawer :open="open" :links="links" @close="open = false">
      <template #footer>
        <BaseButton as="RouterLink" variant="outline" size="small" :to="{ name: 'home' }" @click="open = false">Lihat website</BaseButton>
        <BaseButton variant="danger" size="small" @click="out"><template #icon><AppIcon name="logout" :size="14" /></template>Keluar</BaseButton>
      </template>
    </SideDrawer>
  </header>
  <main class="mn-pad">
    <div v-if="adm.error" class="a-wrap"><div class="card er" role="alert"><h2>Data admin belum bisa dimuat</h2><p class="muted">{{ adm.error }}</p><BaseButton @click="loadAdmin(true)">Coba lagi</BaseButton></div></div>
    <p v-else-if="!adm.loaded" class="a-wrap muted ld" role="status">Memuat data admin…</p>
    <RouterView v-else />
  </main>
</template>
<style scoped>
.hd { position: sticky; top: 0; z-index: 40; background: #fff; border-bottom: 1px solid var(--border); } .in { display: flex; align-items: center; justify-content: space-between; height: 60px; gap: 16px; }
.brand { display: flex; align-items: center; gap: 6px; text-decoration: none; } .n { font-family: Georgia, serif; font-weight: 700; font-size: 24px; color: var(--red); } .s { font-family: Georgia, serif; font-style: italic; font-weight: 700; font-size: 10px; color: var(--navy); align-self: flex-end; padding-bottom: 5px; } .brand .badge { margin-left: 6px; }
.mn { border: none; background: none; } .dk { display: none; } .dka { display: none; }
.mn-pad { padding-top: 20px; padding-bottom: 40px; } .er { display: grid; gap: 10px; justify-items: start; padding: 24px; } .er h2 { font-size: 18px; } .ld { padding: 40px 0; text-align: center; }
@media (min-width: 900px) {
  .mn { display: none; } .dk { display: flex; gap: 18px; margin-left: auto; }
  .dk a { text-decoration: none; font-size: 13px; padding: 6px 0; border-bottom: 2px solid transparent; color: var(--text); display: inline-flex; gap: 6px; align-items: center; } .dk a:hover { color: var(--navy); } .dk a.on { color: var(--navy); font-weight: 700; border-color: var(--navy); }
  .bg { background: var(--red); color: #fff; font-size: 10px; border-radius: var(--r-full); padding: 0 6px; line-height: 16px; }
  .dka { display: flex; align-items: center; gap: 6px; }
  .dka .vt, .dka .lo { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 7px 10px; border-radius: var(--r-6); border: 1px solid var(--border); background: #fff; text-decoration: none; color: var(--text); white-space: nowrap; }
  .dka .vt:hover { border-color: var(--navy); color: var(--navy); }
  .dka .lo { border-color: var(--red); color: var(--red); }
  .dka .lo:hover { background: var(--red-bg); }
}
</style>
