/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Mengubah Next.js menjadi Static HTML murni
  images: {
    unoptimized: true, // Wajib ditambahkan agar error gambar tidak muncul saat mode export
  },
  eslint: {
    ignoreDuringBuilds: true, // Opsional: Mempercepat build dengan mengabaikan warning typo
  }
};

export default nextConfig;