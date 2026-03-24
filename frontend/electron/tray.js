const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')

let tray = null

function setupTray(appInstance, mainWindow) {
  const iconPath = path.join(__dirname, '../public/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('Humanoid')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Assistant',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('tray:open-chat')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(contextMenu)

  // Double-click tray icon to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}

module.exports = { setupTray }
