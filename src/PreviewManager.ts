import EventEmitter from 'eventemitter3'

const PREVIEW_DOM_ID = 'preview'
const SVG_CONTAINER_ID = 'svg-container'
const CLOSE_ID = 'close'

export class PreviewManager extends EventEmitter {
  private rootEl: HTMLElement
  private svgContentEl: HTMLElement
  private closeButton: HTMLButtonElement
  private isShow = false
  private _scale = 1

  private handleScroll = (e: WheelEvent) => {
    if (e.deltaY < 0) this.scale += 0.1
    else if (e.deltaY > 0) this.scale -= 0.1
  }

  private handleClose = () => this.hide()

  private handleKeyUp = (e: KeyboardEvent) => {
    if (!this.isShow) return
    if (e.key === 'Escape') {
      this.hide()
    }
  }

  constructor(id: string = PREVIEW_DOM_ID) {
    super()

    this.rootEl = document.getElementById(id)!
    this.svgContentEl = this.rootEl.querySelector(`#${SVG_CONTAINER_ID}`)!
    this.closeButton = this.rootEl.querySelector(
      `#${CLOSE_ID}`
    ) as HTMLButtonElement

    this.scale = 1.2

    window.addEventListener('keyup', this.handleKeyUp)
    this.svgContentEl.addEventListener('wheel', this.handleScroll)
    this.closeButton.addEventListener('click', this.handleClose)
  }

  set scale(s: number) {
    this._scale = s
    this.svgContentEl.style.transform = `scale(${this.scale})`
  }

  get scale() {
    return this._scale
  }

  show(svg: string) {
    this.rootEl.style.display = 'block'
    svg && (this.svgContentEl.innerHTML = svg)

    this.isShow = true
    this.emit(PreviewManager.ShowEventName)
  }

  hide() {
    this.rootEl.style.removeProperty('display')
    this.svgContentEl.innerHTML = ''
    this.scale = 1.2

    this.isShow = false
    this.emit(PreviewManager.HideEventName)
  }

  static HideEventName = 'hide'
  static ShowEventName = 'show'
}
