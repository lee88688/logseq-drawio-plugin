import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { UiMode } from "./DrawioManager"

export const settings: SettingSchemaDesc[] = [
  {
    key: 'ui',
    title: 'UI',
    default: UiMode.Kennedy,
    description: 'draw.io ui',
    type: 'enum',
    enumChoices: Object.values(UiMode),
    enumPicker: 'radio',
  }
]