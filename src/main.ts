import '@logseq/libs'
import { encode } from 'js-base64'
import './styles/index.css'
import provideCss from './styles/provide.css?inline'
import { DrawioManager } from './DrawioManager'
import { logseq as PL } from '../package.json'
import {
  createFile,
  importFile,
  LogseqDomEvent,
  openFile,
  preview,
  removeFile,
  download,
  copyImage
} from './utils'
import { PreviewManager } from './PreviewManager'
import { SpinnerManager } from './SpinnerManager'
import { settings } from './settings'

const pluginId = PL.id

let drawioManager: DrawioManager
let previewManager: PreviewManager
let spinnerManager: SpinnerManager

function main() {
  console.info(`#${pluginId}: MAIN`)

  drawioManager = new DrawioManager('drawio/index.html')
  previewManager = new PreviewManager()
  spinnerManager = new SpinnerManager()
  const storage = logseq.Assets.makeSandboxStorage()

  if (!import.meta.env.VITE_IS_MOCK) {
    const createModel = () => {
      return {
        edit: (e: LogseqDomEvent) => openFile(e, drawioManager, spinnerManager),
        remove: removeFile,
        preview: (e: LogseqDomEvent) => preview(e, previewManager),
        download: (e: LogseqDomEvent) => download(e, 'origin'),
        'download-svg': (e: LogseqDomEvent) => download(e, 'svg'),
        'copy-image': copyImage
      }
    }

    logseq.provideModel(createModel())
    logseq.setMainUIInlineStyle({
      zIndex: 100
    })

    logseq.provideStyle(provideCss)

    logseq.Editor.registerSlashCommand('import drawio file', ({ uuid }) =>
      importFile(uuid, drawioManager, spinnerManager)
    )
    logseq.Editor.registerSlashCommand('create drawio file', ({ uuid }) =>
      createFile(uuid, drawioManager, spinnerManager)
    )

    logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
      const [type, fileName] = payload.arguments
      if (type !== ':drawio') return

      const svg = await storage.getItem(fileName)
      const simplifiedSvg = svg?.replace(/content=".*?"/, '')
      const base64Svg = encode(simplifiedSvg ?? '')
      const svgImg = `<img style="background-color: white;" src="data:image/svg+xml;base64,${base64Svg}">`

      return logseq.provideUI({
        key: fileName,
        slot,
        reset: true,
        template: `
<div class="drawio-plugin__preview">
  ${svgImg}
  <div class="overlay"></div>
  <div class="drawio-plugin__toolbar">
    <div class="drawio-plugin__toolbar-title"></div>
    <div class="drawio-plugin__toolbar-actions">
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="edit" title="edit file">
        <svg stroke="currentColor" viewBox="0 0 24 24" fill="none"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="download" title="download drawio file">
        <svg viewBox="0 0 1024 1024" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M810.666667 938.666667H213.333333c-72.533333 0-128-55.466667-128-128v-170.666667c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667v170.666667c0 25.6 17.066667 42.666667 42.666666 42.666666h597.333334c25.6 0 42.666667-17.066667 42.666666-42.666666v-170.666667c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667v170.666667c0 72.533333-55.466667 128-128 128z"></path><path d="M512 682.666667c-12.8 0-21.333333-4.266667-29.866667-12.8l-213.333333-213.333334c-17.066667-17.066667-17.066667-42.666667 0-59.733333s42.666667-17.066667 59.733333 0l183.466667 183.466667 183.466667-183.466667c17.066667-17.066667 42.666667-17.066667 59.733333 0s17.066667 42.666667 0 59.733333l-213.333333 213.333334c-8.533333 8.533333-17.066667 12.8-29.866667 12.8z"></path><path d="M512 682.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667V128c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667v512c0 25.6-17.066667 42.666667-42.666667 42.666667z"></path></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="download-svg" title="download svg file with drawio file embeded">
        <svg class="icon" data-spm-anchor-id="a313x.search_index.0.i3.310d3a81tEjUar" viewBox="0 0 1024 1024"><path fill="#333" d="M220 865V159h338v184c0 17 14 31 31 31h184v148h62V312h-1c1-9-3-18-9-24L643 106c-6-6-16-9-25-8H220c-34 0-61 27-61 61v706c0 34 27 62 61 62h368v-62H220zm400-691 139 138H620V174z" data-spm-anchor-id="a313x.search_index.0.i4.310d3a81tEjUar"/><path fill="#333" d="m803 904 121-121-41-40-91 92V575h-58v260l-92-92-41 41 121 121 41 41 40-42zM408 482c-5-3-17-7-33-12l-20-7c-5-3-7-6-7-10s2-7 6-9c3-2 9-3 16-3 8 0 14 1 18 4s7 8 8 15l1 2h26v-4c-1-14-7-25-16-32-9-6-21-9-36-9-14 0-25 3-34 9-11 7-16 16-16 29 0 12 6 21 16 27l29 11c18 5 22 7 23 8 7 3 10 7 10 12 0 2-1 6-6 9s-12 4-20 4c-9 0-16-1-20-4-5-4-8-10-9-18v-3h-27l1 4c0 16 7 29 18 36 9 7 21 10 37 10s29-4 38-10c10-7 15-17 15-29 0-13-6-23-18-30zm107-63-31 93-32-93h-29l46 129h29l46-129zm89 81h32v20a51 51 0 0 1-26 6c-14 0-24-4-30-11s-9-17-9-31 3-25 10-33c6-7 14-10 24-10 9 0 16 2 21 5 5 4 8 9 10 16v3h27l-1-4c-2-15-8-26-17-33-10-8-23-11-40-11-19 0-34 6-45 20a71 71 0 0 0-16 47c0 19 5 35 16 47 11 13 27 20 48 20 11 0 21-2 30-5s17-7 24-12l1-1v-57h-59v24z"/></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="copy-image" title="copy png image to clipboard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="remove">
        <svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
      </button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="max">
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="preview">
        <svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 8v-2a2 2 0 0 1 2 -2h2"></path><path d="M4 16v2a2 2 0 0 0 2 2h2"></path><path d="M16 4h2a2 2 0 0 1 2 2v2"></path><path d="M16 20h2a2 2 0 0 0 2 -2v-2"></path></svg>
      </button>
    </div>
  </div>
</div>
`
      })
    })
  } else {
    const style = document.createElement('style')
    style.innerHTML = provideCss
    document.head.appendChild(style)
    // previewManager.show('')
    // window.preview = previewManager
    // window.spinner = spinnerManager
  }
}

if (import.meta.env.VITE_IS_MOCK) {
  main()
} else {
  logseq.useSettingsSchema(settings).ready(main).catch(console.error)
}
