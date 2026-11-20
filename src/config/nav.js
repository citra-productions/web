export const publicLinks = [
  { label: 'Beranda', to: { name: 'home' } },
  { label: 'Katalog Produk', to: { name: 'catalog' } },
  { label: 'Portofolio', to: { name: 'home', hash: '#portofolio' } },
  { label: 'Testimoni', to: { name: 'home', hash: '#testimoni' } },
  { label: 'FAQ', to: { name: 'home', hash: '#faq' } },
  { label: 'Kontak', to: { name: 'home', hash: '#kontak' } },
]
export const adminLinks = [
  { label: 'Beranda', to: { name: 'admin' }, exact: true },
  { label: 'Produk dan Kategori', id: 'produk', to: { name: 'admin-products' } },
  { label: 'Portofolio', id: 'portofolio', to: { name: 'admin-portfolio' } },
  { label: 'Testimoni', id: 'testimoni', to: { name: 'admin-testimonials' } },
  { label: 'FAQ', id: 'faq', to: { name: 'admin-faq' } },
  { label: 'Kontak', id: 'kontak', to: { name: 'admin-contacts' } },
]
