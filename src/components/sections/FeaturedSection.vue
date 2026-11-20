<script setup>
import { computed } from 'vue'
import ProductCard from './ProductCard.vue'
import { state } from '../../stores/store'
// Diambil dari GET /products?featured=true. Bagian tidak dirender bila tidak ada produk pilihan.
const items = computed(() => state.featuredProducts.slice(0, 8))
</script>
<template>
  <section v-if="items.length" id="produk-pilihan" class="container section" aria-labelledby="fpt">
    <h2 id="fpt" class="section-title">Produk Pilihan</h2>
    <div class="card">
      <div class="gr">
        <ProductCard v-for="p in items" :key="p.id" :product="p" layout="grid" />
      </div>
    </div>
  </section>
</template>
<style scoped>
.card { padding: 14px; }
.gr { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
@media (min-width: 700px) { .gr { grid-template-columns: repeat(4, 1fr); gap: 12px; } .card { padding: 16px; } }
</style>
