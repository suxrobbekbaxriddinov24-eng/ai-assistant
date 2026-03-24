const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to the renderer (React) process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Screen capture
  captureScreen: () => ipcRenderer.invoke('screen:capture'),

  // Execute mouse/keyboard actions (for screen control)
  executeAction: (action) => ipcRenderer.invoke('screen:execute-action', action),

  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', { title, body }),

  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,

  // Listen for events from main process
  on: (channel, callback) => {
    const allowedChannels = ['agent:update', 'tray:open-chat', 'update:available', 'shortcut:new-chat', 'shortcut:settings']
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args))
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  }
})
