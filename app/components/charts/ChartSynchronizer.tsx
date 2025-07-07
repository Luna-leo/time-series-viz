'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface SyncState {
  xRange: [number, number] | null
  cursorX: number | null
  zoom: number
}

interface ChartSyncContextType {
  syncState: SyncState
  updateXRange: (range: [number, number]) => void
  updateCursorX: (x: number | null) => void
  updateZoom: (zoom: number) => void
  registerChart: (id: string) => void
  unregisterChart: (id: string) => void
}

const ChartSyncContext = createContext<ChartSyncContextType | null>(null)

export function useChartSync() {
  const context = useContext(ChartSyncContext)
  if (!context) {
    throw new Error('useChartSync must be used within a ChartSynchronizer')
  }
  return context
}

interface ChartSynchronizerProps {
  children: ReactNode
  enabled?: boolean
}

export function ChartSynchronizer({ children, enabled = true }: ChartSynchronizerProps) {
  const [syncState, setSyncState] = useState<SyncState>({
    xRange: null,
    cursorX: null,
    zoom: 1
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_registeredCharts, setRegisteredCharts] = useState<Set<string>>(new Set())

  const updateXRange = useCallback((range: [number, number]) => {
    if (enabled) {
      setSyncState(prev => ({ ...prev, xRange: range }))
    }
  }, [enabled])

  const updateCursorX = useCallback((x: number | null) => {
    if (enabled) {
      setSyncState(prev => ({ ...prev, cursorX: x }))
    }
  }, [enabled])

  const updateZoom = useCallback((zoom: number) => {
    if (enabled) {
      setSyncState(prev => ({ ...prev, zoom }))
    }
  }, [enabled])

  const registerChart = useCallback((id: string) => {
    setRegisteredCharts(prev => new Set(prev).add(id))
  }, [])

  const unregisterChart = useCallback((id: string) => {
    setRegisteredCharts(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const contextValue: ChartSyncContextType = {
    syncState,
    updateXRange,
    updateCursorX,
    updateZoom,
    registerChart,
    unregisterChart
  }

  return (
    <ChartSyncContext.Provider value={contextValue}>
      {children}
    </ChartSyncContext.Provider>
  )
}