import { app, BrowserWindow, Tray } from 'electron'
import path from 'path'

import { getAssetPath, isDev } from './util.js'


app.on("ready", () => {
   const mainWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      maximizable: true,
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
      }
   })

   if (isDev()) {
      mainWindow.loadURL('http://localhost:5173');
   } else {
      mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'))
   }

   new Tray(path.join(getAssetPath(), 'panda.ico'))

   // Remover barra de menu
   mainWindow.setMenu(null)

   // Maximizar janela
   mainWindow.maximize()

   // Manter DevTools acessível via teclado
   mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === "F12") {
         mainWindow.webContents.toggleDevTools()
      }
   })
})
