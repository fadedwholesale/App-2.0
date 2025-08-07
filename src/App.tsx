import React, { useState, useEffect } from 'react'
import FadedSkiesApp from './components/UserApp'
import FadedSkiesDriverApp from './components/DriverApp'
import FadedSkiesTrackingAdmin from './components/AdminApp'
import { apiService } from './services/api-integration-service'

function App() {
  const [currentApp, setCurrentApp] = useState<'user' | 'driver' | 'admin'>('user')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Selector */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2 flex space-x-2">
          <button
            onClick={() => setCurrentApp('user')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentApp === 'user'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🌿 User App
          </button>
          <button
            onClick={() => setCurrentApp('driver')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentApp === 'driver'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🚚 Driver App
          </button>
          <button
            onClick={() => setCurrentApp('admin')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentApp === 'admin'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 Admin Panel
          </button>
        </div>
      </div>

      {/* Render Current App */}
      {currentApp === 'user' && <FadedSkiesApp />}
      {currentApp === 'driver' && <FadedSkiesDriverApp />}
      {currentApp === 'admin' && <FadedSkiesTrackingAdmin />}
    </div>
  )
}

export default App
