import { DrawioManager, PublicEvents } from './DrawioManager'
import { PreviewManager } from './PreviewManager'
import { SpinnerManager } from './SpinnerManager'
import unescape from 'lodash/unescape'
import { encode } from 'js-base64'

export interface LogseqDomEvent {
  id: string
  type: string
  dataset: Record<string, string>
}

const rendererContentReg = (fileName: string) =>
  new RegExp(`\\{\\{renderer\\s*:drawio,\\s*${fileName}\\}\\}`, 'i')

function isValidFileName(name: string) {
  return /\.(drawio|svg)/i.test(name)
}

function showSaveMessage() {
  logseq.UI.showMsg('file saved')
}

function createRenderer(fileName: string) {
  return `{{renderer :drawio, ${fileName}}}`
}

export const importFile = async (
  uuid: string,
  drawioManager: DrawioManager,
  spinnerManager: SpinnerManager
) => {
  const storage = logseq.Assets.makeSandboxStorage()
  const input = document.createElement('input')
  input.type = 'file'
  const svg = await new Promise<string>((resolve, reject) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file || !isValidFileName(file.name)) {
        reject()
        return
      }
      const fileName = file.name
      const hasFile = await storage.hasItem(fileName)
      if (hasFile) {
        logseq.UI.showMsg('file name already exists!')
        reject()
        return
      }
      const content = await file.text()
      resolve(content)
    })
    // todo: when user not select file will reject too.

    input.click()
  })

  let fileName = ''
  const handleSave = async (data: string) => {
    // save file
    if (!fileName) {
      fileName = `${Date.now()}.svg`
      await logseq.Editor.editBlock(uuid, { pos: 0 })
      await logseq.Editor.insertAtEditingCursor(createRenderer(fileName))
    }

    await storage.setItem(fileName, data)

    showSaveMessage()
  }
  drawioManager.on(PublicEvents.Save, handleSave)
  drawioManager.once(PublicEvents.Exit, () => {
    console.log('off save event')
    drawioManager.off(PublicEvents.Save, handleSave)
    logseq.hideMainUI()
  })

  logseq.showMainUI()
  spinnerManager.show()
  try {
    await drawioManager.open(svg)
  } catch (e) {
    console.log('create file failed', e)
    logseq.hideMainUI()
  } finally {
    spinnerManager.hide()
  }
}

export const createFile = async (
  uuid: string,
  drawioManager: DrawioManager,
  spinnerManager: SpinnerManager
) => {
  const storage = logseq.Assets.makeSandboxStorage()
  let fileName = ''
  const handleSave = async (data: string) => {
    // save file
    if (!fileName) {
      fileName = `${Date.now()}.svg`
      await logseq.Editor.editBlock(uuid, { pos: 0 })
      await logseq.Editor.insertAtEditingCursor(createRenderer(fileName))
    }

    await storage.setItem(fileName, data)

    showSaveMessage()
  }
  drawioManager.on(PublicEvents.Save, handleSave)
  drawioManager.once(PublicEvents.Exit, () => {
    console.log('off save event')
    drawioManager.off(PublicEvents.Save, handleSave)
    logseq.hideMainUI()
  })

  logseq.showMainUI()
  spinnerManager.show()
  try {
    await drawioManager.open()
  } catch (e) {
    console.log('create file failed', e)
    logseq.hideMainUI()
  } finally {
    spinnerManager.hide()
  }
  drawioManager.showTemplate()
}

export const openFile = async (
  e: LogseqDomEvent,
  drawioManager: DrawioManager,
  spinnerManager: SpinnerManager
) => {
  const storage = logseq.Assets.makeSandboxStorage()

  const fileName = e.dataset.fileName
  const uuid = e.dataset.uuid
  const content = await storage.getItem(fileName)

  spinnerManager.show()
  logseq.showMainUI()
  try {
    await drawioManager.open(content)
  } catch (e) {
    console.error('open drawio failed', e)
    logseq.hideMainUI()
    return
  } finally {
    spinnerManager.hide()
  }

  const saveFn = (data: string) => {
    storage.setItem(fileName, data)
    showSaveMessage()
  }
  drawioManager.on(PublicEvents.Save, saveFn)
  drawioManager.once(PublicEvents.Exit, () => {
    drawioManager.off(PublicEvents.Save, saveFn)
    logseq.hideMainUI()
    logseq.Editor.editBlock(uuid)
  })
}

export const removeFile = async (e: LogseqDomEvent) => {
  const storage = logseq.Assets.makeSandboxStorage()

  const fileName = e.dataset.fileName
  const uuid = e.dataset.uuid

  let isUnique = true
  try {
    const arr = await logseq.DB.datascriptQuery(
      `[:find (pull ?b [*]) :where [?b :block/content ?content] [(clojure.string/includes? ?content "${createRenderer(fileName)}")]]`
    )
    if (arr.length > 1) {
      isUnique = false
    }
  } catch (e) {
    logseq.UI.showMsg(`Failed(${String(e)}) to query block!`, 'error')
    return
  }

  if (isUnique) {
    console.log('remove file', fileName)
    await storage.removeItem(fileName)
  }

  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return

  const content = block.content.replace(rendererContentReg(fileName), '')
  logseq.Editor.updateBlock(uuid, content)
}

export const preview = async (
  e: LogseqDomEvent,
  previewManager: PreviewManager
) => {
  const storage = logseq.Assets.makeSandboxStorage()

  const fileName = e.dataset.fileName

  const svg = await storage.getItem(fileName)
  if (!svg) {
    logseq.UI.showMsg(`file(${fileName}) is not found!`, 'error')
    return
  }

  logseq.showMainUI()
  previewManager.show(svg)

  previewManager.once(PreviewManager.HideEventName, () => {
    logseq.hideMainUI()
  })
}

export const download = async (e: LogseqDomEvent, type: 'svg' | 'origin') => {
  const storage = logseq.Assets.makeSandboxStorage()

  const fileName = e.dataset.fileName

  const content = await storage.getItem(fileName)

  if (!content) {
    logseq.UI.showMsg(`file(${fileName}) is not found!`, 'error')
    return
  }

  let file: Blob
  if (type === 'svg') {
    file = new Blob([content])
  } else {
    const match = content.match(/content="(.*?)"/)
    if (!match) {
      logseq.UI.showMsg(
        `original drawio file can't be extracted from logseq file asset.`,
        'error'
      )
      return
    }
    file = new Blob([unescape(match[1])])
  }

  // download
  const newFileName =
    type === 'svg' ? fileName : fileName.replace(/\.svg$/, '.drawio')
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = newFileName
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.href = ''
  })
}

export const copyImage = async (e: LogseqDomEvent) => {
  const storage = logseq.Assets.makeSandboxStorage()

  const fileName = e.dataset.fileName

  const content = await storage.getItem(fileName)

  if (!content) {
    logseq.UI.showMsg(`file(${fileName}) is not found!`, 'error')
    return
  }

  const base64Svg = encode(content ?? '')
  const img = document.createElement('img')
  const { width, height } = await new Promise<{
    width: number
    height: number
  }>((resolve) => {
    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      resolve({ width, height })
    }
    img.src = `data:image/svg+xml;base64,${base64Svg}`
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // when use ctx.clearRect and export to clipboard, the background is black.
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0)
  const type = 'image/png'
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type)
  )
  if (!blob) return

  // only showing ui and focus can use clipboard api
  await logseq.showMainUI({ autoFocus: true })

  try {
    await navigator.clipboard.write([new ClipboardItem({ [type]: blob })])
    logseq.UI.showMsg('Copied to clipboard!', 'success')
  } catch (e) {
    logseq.UI.showMsg(`Failed(${String(e)}) to copy to clipboard!`, 'error')
  } finally {
    logseq.hideMainUI()
  }
}
