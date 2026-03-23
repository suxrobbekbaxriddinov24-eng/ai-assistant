const { ipcMain, app, Notification, desktopCapturer, screen } = require('electron')

function setupIpcHandlers(mainWindow) {
  // Window controls
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())

  // App info
  ipcMain.handle('app:version', () => app.getVersion())

  // Screen capture — takes a screenshot and returns base64 PNG
  ipcMain.handle('screen:capture', async () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    })
    const primaryScreen = sources[0]
    if (!primaryScreen) throw new Error('No screen found')
    // thumbnail is a NativeImage
    return primaryScreen.thumbnail.toDataURL().replace('data:image/png;base64,', '')
  })

  // Execute screen control actions (runs PyAutoGUI via Python child process)
  ipcMain.handle('screen:execute-action', async (event, action) => {
    const { execFile } = require('child_process')
    const path = require('path')

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../offline/screen_executor.py')
      const args = [scriptPath, JSON.stringify(action)]

      execFile('python', args, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Screen action error:', stderr)
          reject(new Error(stderr || error.message))
        } else {
          resolve(JSON.parse(stdout || '{"success": true}'))
        }
      })
    })
  })

  // Desktop notifications
  ipcMain.handle('notification:show', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })
}

module.exports = { setupIpcHandlers }
