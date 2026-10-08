import { copyFileSync, cpSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageMetadata from './package.json' with { type: 'json' }

export default defineConfig({
  base: '/travelpilot-poc/',
  plugins: [
    react(),
    {
      name: 'canonical-branding',
      writeBundle(options) {
        // Copy the originals byte-for-byte; keep their canonical relative paths.
        const destination = `${options.dir}/assets/images`
        mkdirSync(destination, { recursive: true })
        for (const filename of ['travelpilot_banner.PNG', 'travelpilot_icon.PNG']) {
          copyFileSync(
            fileURLToPath(new URL(`./assets/images/${filename}`, import.meta.url)),
            `${destination}/${filename}`,
          )
        }
        cpSync(fileURLToPath(new URL('./assets/demo', import.meta.url)), `${options.dir}/assets/demo`, { recursive: true })
      },
    },
  ],
  define: { __APP_VERSION__: JSON.stringify(`v${packageMetadata.version}`) },
})
