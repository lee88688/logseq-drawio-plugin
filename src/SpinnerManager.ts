const SPNNER_ID = 'spinner'

export class SpinnerManager {
  private rootEl: HTMLElement

  constructor(id = SPNNER_ID) {
    this.rootEl = document.getElementById(id)!
  }

  hide() {
    this.rootEl.style.removeProperty('display')
  }

  show() {
    this.rootEl.style.display = 'block'
  }
}
