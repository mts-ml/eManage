import { app, BrowserWindow } from 'electron'
import path from 'path'


app.on("ready", () => {
   const mainWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      maximizable: true,
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true
      }
   })

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

   mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'))
})
