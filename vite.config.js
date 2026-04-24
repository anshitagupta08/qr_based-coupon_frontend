import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    allowedHosts: ["promotions.abispro.com", "localhost", "127.0.0.1"],
    proxy: {
      '/api': {
        target: 'https://retailuat.abisaio.com:9001',//dev
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
