// electron.vite.config.ts
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main':   resolve('src/main'),
        '@shared': resolve('src/shared'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer':    resolve('src/renderer/src'),
        '@components':  resolve('src/renderer/src/components'),
        '@pages':       resolve('src/renderer/src/pages'),
        '@store':       resolve('src/renderer/src/store'),
        '@hooks':       resolve('src/renderer/src/hooks'),
        '@lib':         resolve('src/renderer/src/lib'),
        '@shared':      resolve('src/shared'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  },
})