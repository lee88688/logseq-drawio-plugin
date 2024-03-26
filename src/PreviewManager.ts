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
  private _moveX = 0
  private _moveY = 0

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

  private handleMouseMove = (e: MouseEvent) => {
    const { movementX, movementY } = e
    this.moveX = this.moveX + movementX / this.scale
    this.moveY = this.moveY + movementY / this.scale
  }

  private handleSvgMouseDown = () => {
    window.addEventListener('mousemove', this.handleMouseMove)
  }

  private handleMouseUp = () => {
    window.removeEventListener('mousemove', this.handleMouseMove)
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
    this.svgContentEl.addEventListener('mousedown', this.handleSvgMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)

    this.closeButton.addEventListener('click', this.handleClose)
  }

  set scale(s: number) {
    this._scale = s
    this.svgContentEl.style.setProperty('--preview-scale', `${s}`)
  }

  get scale() {
    return this._scale
  }

  set moveX(x: number) {
    this._moveX = x
    this.svgContentEl.style.setProperty('--preview-move-x', `${x}px`)
  }

  get moveX() {
    return this._moveX
  }

  set moveY(y: number) {
    this._moveY = y
    this.svgContentEl.style.setProperty('--preview-move-y', `${y}px`)
  }

  get moveY() {
    return this._moveY
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
    this.moveX = 0
    this.moveY = 0

    this.isShow = false
    this.emit(PreviewManager.HideEventName)
  }

  static HideEventName = 'hide'
  static ShowEventName = 'show'
}
