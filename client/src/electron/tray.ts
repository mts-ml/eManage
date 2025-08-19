import { app, BrowserWindow, Menu, Tray } from "electron"
import path from 'path'

import { getAssetPath } from "./util.js"


export function createTray(mainWindow: BrowserWindow) {
   const tray = new Tray(path.join(getAssetPath(), 'eManage.ico'))

   tray.setToolTip("🏢 eManage")

   tray.setContextMenu(Menu.buildFromTemplate([
      {
         label: 'Mostrar janela',
         click: () => {
            mainWindow.show()
            if (app.dock) app.dock.show() // Para MacOs
         },
      },
      {
         label: 'Sair',
         click: () => app.quit()
      }
   ]))

   tray.on('click', () => {
      if (mainWindow.isVisible()) {
         mainWindow.hide()
      } else {
         mainWindow.show()
      }
   })
}
