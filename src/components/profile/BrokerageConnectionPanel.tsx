"use client"

import { useState } from "react"
import { Plus, RefreshCw, Unlink, CheckCircle, XCircle, Clock } from "lucide-react"


const canRefreshConnection = (lastSyncDate: string): boolean => {
  if (!lastSyncDate) return true // Never synced, allow refresh
  
  const lastSync = new Date(lastSyncDate)
  const now = new Date()
 // const hoursElapsed = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
  let hoursElapsed = 24
  return hoursElapsed >= 24
}

const getTimeUntilNextRefresh = (lastSyncDate: string): string => {
  if (!lastSyncDate) return "Available now"
  
  const lastSync = new Date(lastSyncDate)
  const now = new Date()
  const hoursElapsed = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
  
  if (hoursElapsed >= 24) return "Available now"
  
  const hoursRemaining = 24 - hoursElapsed
  const hours = Math.floor(hoursRemaining)
  const minutes = Math.floor((hoursRemaining - hours) * 60)
  
  if (hours > 0) {
    return `Available soon`
  } else {
    return `Available in ${minutes}m`
  }
}

interface BrokerageConnection {
  id: string  
  name: string
  status: "connected" | "disconnected" | "syncing"
  lastSync: string
  accountValue: number
  logo: string
}

interface BrokerageConnectionPanelProps {
  connections: BrokerageConnection[]
  onConnect?: () => void
  onRefresh?: (id: string) => void  
  onDisconnect?: (id: string) => void 
}

export default function BrokerageConnectionPanel({
  connections,
  onConnect,
  onRefresh,
  onDisconnect,
}: BrokerageConnectionPanelProps) {
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const handleRefresh = async (id: string) => {
    setRefreshingId(id)
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call
    onRefresh?.(id)
    setRefreshingId(null)
  }

  const totalPortfolioValue = connections
    .filter((conn) => conn.status === "connected")
    .reduce((sum, conn) => sum + conn.accountValue, 0)

  const connectedCount = connections.filter((conn) => conn.status === "connected").length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "disconnected":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "syncing":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "border-green-200 bg-green-50"
      case "disconnected":
        return "border-red-200 bg-red-50"
      case "syncing":
        return "border-yellow-200 bg-yellow-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Brokerage Connections</h3>
          {connections.length > 0 && (<button 
            onClick={onConnect}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Connect New</span>
          </button>)}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Portfolio Summary */}
        {connectedCount > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalPortfolioValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Portfolio</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
                <p className="text-sm text-gray-600">Connected Accounts</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection List */}
        <div className="space-y-3">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={`p-4 rounded-lg border transition-all ${getStatusColor(connection.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                {connection.logo.startsWith('http') ? (
                <img 
                src={connection.logo} 
                alt={`${connection.name} logo`}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.currentTarget
                const parent = target.parentElement
                if (parent) {
                target.style.display = 'none'
                parent.innerHTML = '🏦' // Bank emoji fallback
                parent.classList.add('text-2xl')
                parent.classList.remove('w-8', 'h-8')
                }
                }}
                />
                ) : (
                <span className="text-2xl">{connection.logo}</span>
                )}
                </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{connection.name}</h4>
                      {getStatusIcon(connection.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {connection.status === "connected" && `Last sync: ${connection.lastSync}`}
                      {connection.status === "disconnected" && "Disconnected"}
                      {connection.status === "syncing" && "Syncing..."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                {connection.status === "connected" && (
  <>
    <div className="text-right">
      <p className="font-semibold text-gray-900">${connection.accountValue.toLocaleString()}</p>
      <p className="text-xs text-gray-500">Account Value</p>
    </div>
    
    {/* Smart Refresh Button with Tooltip */}
    <div className="relative group">
      <button
        onClick={() => {
          const canRefresh = canRefreshConnection(connection.lastSync)
          if (canRefresh) {
            handleRefresh(connection.id)
          }
        }}
        disabled={refreshingId === connection.id || !canRefreshConnection(connection.lastSync)}
        className={`p-2 rounded-lg transition-colors ${
          canRefreshConnection(connection.lastSync)
            ? 'text-gray-600 hover:text-gray-900 hover:bg-white'
            : 'text-gray-300 cursor-not-allowed'
        } ${refreshingId === connection.id ? 'opacity-50' : ''}`}
        title={canRefreshConnection(connection.lastSync) ? "Refresh connection" : undefined}
      >
        <RefreshCw className={`w-4 h-4 ${refreshingId === connection.id ? "animate-spin" : ""}`} />
      </button>
      
      {/* Tooltip for disabled state */}
       {!canRefreshConnection(connection.lastSync) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="text-center">
            <div>Data refreshes once per day</div>
            <div className="text-gray-300">{getTimeUntilNextRefresh(connection.lastSync)}</div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  </>
)}

                  {connection.status === "disconnected" && (
                    <button
                      onClick={onConnect}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 hover:bg-blue-50 bg-transparent rounded-lg transition-colors"
                    >
                      Reconnect
                    </button>
                  )}

                  {connection.status === "connected" && (
                    <button
                      onClick={() => onDisconnect?.(connection.id)}                      
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Disconnect"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {connections.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔗</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Connections Yet</h4>
            <p className="text-gray-600 mb-4">
              Connect your brokerage accounts to track your portfolio and sync trades automatically.
            </p>
            <button 
              onClick={onConnect}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Your First Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}