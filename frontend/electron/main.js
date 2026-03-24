const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron')
const path = require('path')
const { setupTray } = require('./tray')
const { setupIpcHandlers } = require('./ipc-handlers')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null
let isQuitting = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,         // Custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#030712',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

app.whenReady().then(() => {
  const win = createWindow()
  setupTray(app, win)
  setupIpcHandlers(win)

  // Keyboard shortcuts
  globalShortcut.register('CommandOrControl+N', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('shortcut:new-chat')
    }
  })

  globalShortcut.register('CommandOrControl+,', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('shortcut:settings')
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

module.exports = { getMainWindow: () => mainWindow }
