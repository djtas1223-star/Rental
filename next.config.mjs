/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevenção contra Clickjacking: impede que o painel admin seja embutido em iframes maliciosos
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevenção contra MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Política de Referrer estrita para não vazar URLs com tokens em cabeçalhos
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Proteção XSS legada para navegadores compatíveis
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Bloqueio de APIs invasivas desnecessárias
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
