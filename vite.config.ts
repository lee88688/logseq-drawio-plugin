// import reactPlugin from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import logseqDevPlugin from 'vite-plugin-logseq'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    logseqDevPlugin(),
    // reactPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: 'drawio/src/main/webapp/index.html',
          dest: 'drawio'
        },
        {
          src: 'drawio/src/main/webapp/(styles|images|img|resources|mxgraph|templates)',
          dest: 'drawio'
        },
        // math
        {
          src: [
            'drawio/src/main/webapp/math/es5/(a11y|adaptors|input|output|sre|ui)',
            'drawio/src/main/webapp/math/es5/(core|startup).js'
          ],
          dest: 'drawio/math/es5'
        },
        {
          src: 'drawio/src/main/webapp/js/(PreConfig|PostConfig).js',
          dest: 'drawio/js'
        },
        {
          src: 'drawio/src/main/webapp/js/(app|shapes-*|stencils|viewer|extensions).min.js',
          dest: 'drawio/js'
        }
      ]
    })
  ],
  // Makes HMR available for development
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
})
