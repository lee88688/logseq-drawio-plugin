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
  download
} from './utils'
import { PreviewManager } from './PreviewManager'
import { SpinnerManager } from './SpinnerManager'
import { settings } from './settings'

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args)

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
        download
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
      const simplifiedSvg = svg?.replace(/content=\".*?\"/, '')
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
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="edit">
        <svg width="18" height="18" stroke="currentColor" viewBox="0 0 24 24" fill="none"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="download">
        <svg viewBox="0 0 1024 1024" width="18" height="18" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M810.666667 938.666667H213.333333c-72.533333 0-128-55.466667-128-128v-170.666667c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667v170.666667c0 25.6 17.066667 42.666667 42.666666 42.666666h597.333334c25.6 0 42.666667-17.066667 42.666666-42.666666v-170.666667c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667v170.666667c0 72.533333-55.466667 128-128 128z"></path><path d="M512 682.666667c-12.8 0-21.333333-4.266667-29.866667-12.8l-213.333333-213.333334c-17.066667-17.066667-17.066667-42.666667 0-59.733333s42.666667-17.066667 59.733333 0l183.466667 183.466667 183.466667-183.466667c17.066667-17.066667 42.666667-17.066667 59.733333 0s17.066667 42.666667 0 59.733333l-213.333333 213.333334c-8.533333 8.533333-17.066667 12.8-29.866667 12.8z"></path><path d="M512 682.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667V128c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667v512c0 25.6-17.066667 42.666667-42.666667 42.666667z"></path></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="remove">
        <svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
      </button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="max">
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="preview">
        <svg  width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 8v-2a2 2 0 0 1 2 -2h2"></path><path d="M4 16v2a2 2 0 0 0 2 2h2"></path><path d="M16 4h2a2 2 0 0 1 2 2v2"></path><path d="M16 20h2a2 2 0 0 0 2 -2v-2"></path></svg>
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
