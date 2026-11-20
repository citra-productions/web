// Pengaturan antarmuka. Data (produk, kontak, dll.) sekarang datang dari API, bukan dari file ini.
export const siteConfig = {
  maxPhotosPerProduct: 5,
  maxPhotosPerPortfolio: 6,
  maxUploadBytes: 2 * 1024 * 1024, // 2MB per file, sesuai teks di desain (server menerima sampai 5MB)
  businessName: 'Citra Productions',
}
