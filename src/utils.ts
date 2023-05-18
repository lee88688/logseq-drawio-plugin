import { BlockCommandCallback } from '@logseq/libs/dist/LSPlugin'
import { DrawioManager, PublicEvents } from './DrawioManager'

function isValidFileName(name: string) {
  return /\.(drawio|svg)/i.test(name)
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
      await logseq.Editor.insertAtEditingCursor(
        `{{renderer :mhtml, ${fileName}}}`
      )
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
  const handleSave = async (data: string) => {
    // save file
    const fileName = `${Date.now()}.svg`
    await storage.setItem(fileName, data)
    await logseq.Editor.editBlock(uuid, { pos: 0 })
    logseq.Editor.insertAtEditingCursor(`{{renderer :drawio, ${fileName}}}`)
  }
  drawioManager.on(PublicEvents.Save, handleSave)
  drawioManager.once(PublicEvents.Exit, () => {
    console.log('off save event')
    drawioManager.off(PublicEvents.Save, handleSave)
    logseq.hideMainUI()
  })

  await drawioManager.open()
  logseq.showMainUI()
  drawioManager.showTemplate()
}
