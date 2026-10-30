import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ 접두사가 없는 값(JEJU_*)은 여기(서버)에서만 읽힘 → 브라우저에 노출 안 됨
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')

  // /jeju/info?page=1 → odcloud API (+ serviceKey 자동 추가, CORS 회피)
  const api = (urlKey, keyKey) => {
    const u = new URL(env[urlKey] || 'https://api.odcloud.kr/api/none')
    const key = env[keyKey] || ''
    const k = key.includes('%') ? key : encodeURIComponent(key)
    return {
      target: u.origin,
      changeOrigin: true,
      rewrite: (p) => u.pathname + (p.includes('?') ? p.slice(p.indexOf('?')) + '&' : '?') + 'serviceKey=' + k,
    }
  }

  return {
    server: {
      proxy: {
        '/jeju/info': api('JEJU_INFO_URL', 'JEJU_INFO_KEY'),
        '/jeju/location': api('JEJU_LOCATION_URL', 'JEJU_LOCATION_KEY'),
      },
    },
  }
})
