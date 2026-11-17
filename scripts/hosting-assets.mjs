// Share cache/security/routing behavior across both public asset packages.
export const assetHeaders = '/*\n  Cache-Control: no-cache\n  X-Content-Type-Options: nosniff\n/sw.js\n  Cache-Control: no-cache\n/exercise-guides/poses/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n';
export const assetRedirects = '/ /index.html 200\n';
