import '@logseq/libs'
import './styles/index.css'
import provideCss from './styles/provide.css?inline'
import { DrawioManager } from './DrawioManager'

import { logseq as PL } from '../package.json'
import { createFile, importFile, openFile, removeFile } from './utils'

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args)

const pluginId = PL.id

let drawioManager: DrawioManager

function main() {
  console.info(`#${pluginId}: MAIN`)

  drawioManager = new DrawioManager('drawio/index.html')
  const storage = logseq.Assets.makeSandboxStorage()

  if (!import.meta.env.VITE_IS_MOCK) {
    const createModel = () => {
      return {
        edit: (e: any) => openFile(e, drawioManager),
        remove: removeFile
      }
    }

    logseq.provideModel(createModel())
    logseq.setMainUIInlineStyle({
      zIndex: 11
    })

    const openIconName = 'drawio-plugin-open'

    logseq.provideStyle(css`
      .${openIconName} {
        opacity: 0.55;
        font-size: 20px;
        margin-top: 4px;
      }

      .${openIconName}:hover {
        opacity: 0.9;
      }
    `)

    logseq.provideStyle(provideCss)

    logseq.Editor.registerSlashCommand('import drawio file', importFile)
    logseq.Editor.registerSlashCommand('create drawio file', ({ uuid }) =>
      createFile(uuid, drawioManager)
    )

    logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
      const [type, fileName] = payload.arguments
      if (type !== ':drawio') return

      const svg = await storage.getItem(fileName)

      return logseq.provideUI({
        key: fileName,
        slot,
        reset: true,
        template: `
<div class="drawio-plugin__preview">
  ${svg}
  <div class="drawio-plugin__toolbar">
    <div class="drawio-plugin__toolbar-title"></div>
    <div class="drawio-plugin__toolbar-actions">
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="edit">
      <svg width="18" height="18" stroke="currentColor" viewBox="0 0 24 24" fill="none"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path></svg>
      </button>
      <button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="remove">
        <svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
      </button data-file-name="${fileName}" data-uuid="${payload.uuid}" data-on-click="max">
      <button>
        <svg  width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 8v-2a2 2 0 0 1 2 -2h2"></path><path d="M4 16v2a2 2 0 0 0 2 2h2"></path><path d="M16 4h2a2 2 0 0 1 2 2v2"></path><path d="M16 20h2a2 2 0 0 0 2 -2v-2"></path></svg>
      </button>
    </div>
  </div>
</div>
`
      })
    })

    logseq.App.registerUIItem('toolbar', {
      key: openIconName,
      template: `
      <div data-on-click="show" class="${openIconName}">⚙️</div>
    `
    })
  } else {
    const style = document.createElement('style')
    style.innerHTML = provideCss
    document.head.appendChild(style)
  }
}

if (import.meta.env.VITE_IS_MOCK) {
  main()
} else {
  logseq.ready(main).catch(console.error)
}
