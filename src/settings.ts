import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { SettingDarkMode, UiMode } from './DrawioManager'

export const settings: SettingSchemaDesc[] = [
  {
    key: 'ui',
    title: 'UI',
    default: UiMode.Kennedy,
    description: 'draw.io ui',
    type: 'enum',
    enumChoices: Object.values(UiMode),
    enumPicker: 'radio'
  },
  {
    key: 'darkMode',
    title: 'Dark Mode',
    default: SettingDarkMode.Auto,
    description: 'draw.io dark mode',
    type: 'enum',
    enumChoices: Object.values(SettingDarkMode),
    enumPicker: 'radio'
  }
]
