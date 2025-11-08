import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// visualizer will be used only when ANALYZE=true
let visualizerPlugin = null
if (process.env.ANALYZE === 'true') {
  // Use dynamic ESM import (supported in Node ESM) to load the plugin only when needed
  const { visualizer } = await import('rollup-plugin-visualizer')
  visualizerPlugin = visualizer({
    filename: path.resolve(__dirname, '..', '..', 'tmp', 'dashboard-visualizer.html'),
    title: 'dashboard bundle visualizer',
    sourcemap: true,
    gzipSize: true,
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(visualizerPlugin ? [visualizerPlugin] : [])],
  build: {
    // Split vendor chunks to reduce single large chunk and improve cacheability
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor_react'
            if (id.includes('socket.io-client')) return 'vendor_socketio'
            if (id.includes('date-fns')) return 'vendor_datefns'
            if (id.includes('emoji-picker-react')) return 'vendor_emoji'
            if (id.includes('simplebar-react')) return 'vendor_simplebar'
            return 'vendor_misc'
          }
        },
      },
    },
    // Keep default warning small but explicit
    chunkSizeWarningLimit: 600,
  },
})
