import { app, BrowserWindow } from 'electron'
import path from 'path'

import { isDev } from './util.js'
import { createTray } from './tray.js'


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

   createTray(mainWindow) // Ícone na barra de tarefas
   
   mainWindow.setMenu(null) // Remover barra de menu
   mainWindow.maximize() // Maximizar janela

   // Manter DevTools acessível via teclado
   mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === "F12") {
         mainWindow.webContents.toggleDevTools()
      }
   })

   function handleCloseEvents(mainWindow: BrowserWindow) {
      let willClose = false

      mainWindow.on('close', (event) => {
         if (willClose) return

         event.preventDefault()
         mainWindow.hide()

         if (app.dock) app.dock.hide() // Para MacOs
      })

      app.on("before-quit", () => {
         willClose = true
      })

      mainWindow.on('show', () => {
         willClose = false
      })
   }

   handleCloseEvents(mainWindow)

})
