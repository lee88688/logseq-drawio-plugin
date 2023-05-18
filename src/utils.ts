import { BlockCommandCallback } from '@logseq/libs/dist/LSPlugin'
import { DrawioManager, PublicEvents } from './DrawioManager'

interface LogseqDomEvent {
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

export const importFile: BlockCommandCallback = async () => {
  const storage = logseq.Assets.makeSandboxStorage()
  const input = document.createElement('input')
  input.type = 'file'
  return new Promise<void>((resolve, reject) => {
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
      await storage.setItem(fileName, content)
      await logseq.Editor.insertAtEditingCursor(createRenderer(fileName))
      resolve()
    })
    // todo: when user not select file will reject too.

    input.click()
  })
}

export const createFile = async (
  uuid: string,
  drawioManager: DrawioManager
) => {
  const storage = logseq.Assets.makeSandboxStorage()
  let fileName = ''
  const handleSave = async (data: string) => {
    // save file
    if (!fileName) {
      fileName = `${Date.now()}.svg`
      // const block = await logseq.Editor.getBlock(uuid)
      // await logseq.Editor.updateBlock(
      //   uuid,
      //   block?.content + createRenderer(fileName)
      // )
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
  await drawioManager.open()
  drawioManager.showTemplate()
}

export const openFile = async (
  e: LogseqDomEvent,
  drawioManager: DrawioManager
) => {
  const storage = logseq.Assets.makeSandboxStorage()

  const fileName = e.dataset.fileName
  const uuid = e.dataset.uuid
  const content = await storage.getItem(fileName)
  await drawioManager.open(content)
  logseq.showMainUI()

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

  await storage.removeItem(fileName)

  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return

  const content = block.content.replace(rendererContentReg(fileName), '')
  logseq.Editor.updateBlock(uuid, content)
}
