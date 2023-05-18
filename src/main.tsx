import '@logseq/libs'
import './styles/index.css'
import provideCss from './styles/provide.css?inline'
import { DrawioManager } from './DrawioManager'

import { logseq as PL } from '../package.json'
import { createFile, importFile } from './utils'

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args)

const pluginId = PL.id

let drawioManager: DrawioManager

function main() {
  console.info(`#${pluginId}: MAIN`)

  drawioManager = new DrawioManager('drawio/index.html')

  if (!import.meta.env.VITE_IS_MOCK) {
    const createModel = () => {
      return {
        show() {
          logseq.showMainUI()
        }
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

    const storage = logseq.Assets.makeSandboxStorage()
    logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
      const [type, fileName] = payload.arguments
      if (type !== ':drawio') return

      const svg = await storage.getItem(fileName)

      return logseq.provideUI({
        key: `${slot}`,
        slot,
        reset: true,
        template: `
<div class="drawio-plugin__preview">
<!--  <img src="https://placehold.co/600x400/EEE/31343C">-->
  ${svg}
  <div class="drawio-plugin__toolbar">
    <div class="drawio-plugin__toolbar-title"></div>
    <div class="drawio-plugin__toolbar-actions">
      <button>
        <svg xmlns="http://www.w3.org/2000/svg"  width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
      </button>
      <button>
        <svg xmlns="http://www.w3.org/2000/svg"  width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 8v-2a2 2 0 0 1 2 -2h2"></path><path d="M4 16v2a2 2 0 0 0 2 2h2"></path><path d="M16 4h2a2 2 0 0 1 2 2v2"></path><path d="M16 20h2a2 2 0 0 0 2 -2v-2"></path></svg>
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
