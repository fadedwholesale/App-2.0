import React, { useState, useEffect } from 'react'
import FadedSkiesApp from './components/UserApp'
import FadedSkiesDriverApp from './components/DriverApp'
import FadedSkiesTrackingAdmin from './components/AdminApp'
import { apiService } from './services/api-integration-service'

function App() {
  const [currentApp, setCurrentApp] = useState<'user' | 'driver' | 'admin'>('user')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  // Check backend connection on mount
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          setBackendStatus('connected')
        } else {
          setBackendStatus('disconnected')
        }
      } catch (error) {
        setBackendStatus('disconnected')
      }
    }

    checkBackendConnection()
    // Check every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Backend Status Indicator */}
      {backendStatus === 'disconnected' && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="font-medium">Backend Offline</p>
                <p className="text-sm">Start backend: <code className="bg-yellow-200 px-1 rounded">cd backend && npm run dev</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {backendStatus === 'connected' && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <p className="font-medium">Backend Connected</p>
            </div>
          </div>
        </div>
      )}

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
