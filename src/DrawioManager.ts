import EventEmitter from 'eventemitter3'
import { decode } from 'js-base64'

enum UiMode {
  Kennedy = 'kennedy',
  Min = 'min',
  Sketch = 'sketch',
  Simple = 'simple'
}

enum DarkMode {
  Off = '0',
  On = '1',
  Auto = 'auto'
}

export enum PublicEvents {
  Save = 'save',
  Exit = 'exit'
}

interface UrlConfig {
  ui: UiMode
  dark: DarkMode
  embed: '1'
  proto: 'json'
  spin: '1'
}

type Action =
  | {
      action: 'load'
      xml: string
    }
  | {
      action: 'export'
      format: 'xmlsvg' | 'xmlpng'
      [key: string]: string
    }
  | {
      action: 'template'
    }

interface ExportEvent {
  event: 'export'
  data: string
  xml: string
}

class ConfigManager {
  urlConfig: UrlConfig = {
    ui: UiMode.Kennedy,
    dark: DarkMode.Auto,
    embed: '1',
    proto: 'json',
    spin: '1'
  }

  constructor(private baseUrl: string) {}

  get url() {
    const urlParams = new URLSearchParams(this.urlConfig as any)
    return `${this.baseUrl}?${urlParams.toString()}`
  }
}

export class DrawioManager extends EventEmitter {
  private configManager: ConfigManager
  private iframeEl?: HTMLIFrameElement
  private ready = false
  private messageEventEmitter = new EventEmitter()

  private handleMessageEvent = (e: MessageEvent) => {
    if (typeof e.data !== 'string') return

    let json
    try {
      json = JSON.parse(e.data)
      if (!json.event) return
    } catch (e) {
      // pass
    }

    console.log(json)
    this.messageEventEmitter.emit(json.event, json)
  }

  private handleSave = async () => {
    this.sendAction({
      action: 'export',
      format: 'xmlsvg',
      background: 'transparent'
    })
    const exportEvent = (await this.waitFor('export')) as ExportEvent
    const index = exportEvent.data.indexOf(',')
    const base64 = exportEvent.data.slice(index + 1)
    this.emit(PublicEvents.Save, decode(base64))
  }

  private handleExit = async () => {
    this.emit(PublicEvents.Exit)
    this.hideFrame()
    this.ready = false
  }

  constructor(baseUrl: string, configManager?: ConfigManager) {
    super()

    this.configManager = configManager ?? new ConfigManager(baseUrl)

    window.addEventListener('message', this.handleMessageEvent)

    this.messageEventEmitter.on('init', () => (this.ready = true))
    this.messageEventEmitter.on('save', this.handleSave)
    this.messageEventEmitter.on('exit', this.handleExit)

    // document
    //   .getElementById('window-minimize')
    //   ?.addEventListener('click', () => logseq)
    // document
    //   .getElementById('window-maximize')
    //   ?.addEventListener('click', () => logseq)
    // document
    //   .getElementById('window-close')
    //   ?.addEventListener('click', () => logseq)
  }

  async waitFor(type: string) {
    return new Promise((resolve) => {
      this.messageEventEmitter.once(type, (e) => resolve(e))
    })
  }

  sendAction(action: Action) {
    if (!this.ready) return

    this.iframeEl?.contentWindow?.postMessage(JSON.stringify(action), '*')
  }

  createFrame() {
    this.iframeEl = document.createElement('iframe')
    const node = document.getElementById('iframe-inner')!
    node.appendChild(this.iframeEl)
  }

  hideFrame() {
    document.getElementById('iframe-wrap')?.style.setProperty('display', 'none')
    this.iframeEl?.setAttribute('style', 'display: none;')
    this.iframeEl?.removeAttribute('src')
  }

  showFrame() {
    if (!this.iframeEl) this.createFrame()
    const wrap = document.getElementById('iframe-wrap')
    wrap?.style.setProperty('display', 'block')
    const height =
      window.top?.document.getElementById('head')?.offsetHeight ?? 0
    wrap?.style.setProperty('--iframe-top', `${height}px`)
    this.iframeEl?.removeAttribute('style')
    this.iframeEl?.setAttribute('src', this.configManager.url)
  }

  async open(xml?: string) {
    this.showFrame()
    await this.waitFor('init')
    this.sendAction({ action: 'load', xml: xml ?? '' })
  }

  showTemplate() {
    this.sendAction({ action: 'template' })
  }
}
