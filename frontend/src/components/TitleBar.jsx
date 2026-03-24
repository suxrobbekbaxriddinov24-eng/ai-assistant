const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export default function TitleBar() {
  if (!isElectron) return null

  return (
    <div
      className="flex items-center justify-between bg-gray-900 border-b border-gray-800 select-none"
      style={{ height: '36px', WebkitAppRegion: 'drag' }}
    >
      {/* Logo + name */}
      <div className="flex items-center gap-2 px-3">
        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
          H
        </div>
        <span className="text-white text-xs font-semibold">Humanoid</span>
      </div>

      {/* Window controls */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Minimize */}
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          className="w-10 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
          title="Minimize"
        >
          ─
        </button>
        {/* Maximize */}
        <button
          onClick={() => window.electronAPI.maximizeWindow()}
          className="w-10 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs"
          title="Maximize"
        >
          □
        </button>
        {/* Close */}
        <button
          onClick={() => window.electronAPI.closeWindow()}
          className="w-10 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-colors text-sm"
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
