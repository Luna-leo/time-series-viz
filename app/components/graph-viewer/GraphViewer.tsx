'use client'

import { useState, useEffect, useMemo } from 'react'
import { DataSet, TimeSeriesData, Parameter } from '@/app/types/data'
import { getDatasets, getTimeSeriesData, getParameters } from '@/app/lib/db/operations'
import { ColorRGBA } from 'webgl-plot'
import TimeSeriesChart from '../charts/TimeSeriesChart'
import ChartGrid from '../charts/ChartGrid'
import { ChartSynchronizer } from '../charts/ChartSynchronizer'
import DatasetSelector from './DatasetSelector'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// Extended parameter with dataset info
interface ExtendedParameter extends Parameter {
  datasetId: number
  datasetName: string
  datasetColor: ColorRGBA
}

export default function GraphViewer() {
  const [containerWidth, setContainerWidth] = useState(1000)
  const [datasets, setDatasets] = useState<DataSet[]>([])
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])
  const [datasetsData, setDatasetsData] = useState<Map<number, TimeSeriesData[]>>(new Map())
  const [datasetsParameters, setDatasetsParameters] = useState<Map<number, Parameter[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const [timeMode, setTimeMode] = useState<'absolute' | 'relative'>('absolute')
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [mergedDataStats, setMergedDataStats] = useState({
    totalPoints: 0,
    startDate: null as Date | null,
    endDate: null as Date | null
  })
  const [datasetStartTimes, setDatasetStartTimes] = useState<Map<number, number>>(new Map())

  // Generate dataset colors
  const datasetColors = useMemo(() => {
    const colors = new Map<number, ColorRGBA>()
    datasets.forEach((dataset, index) => {
      const hue = (index * 137.5) % 360 // Golden angle for good color distribution
      const rgb = hslToRgb(hue / 360, 0.6, 0.5)
      colors.set(dataset.id!, new ColorRGBA(rgb[0], rgb[1], rgb[2], 1))
    })
    return colors
  }, [datasets])

  // Set container width on mount
  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(window.innerWidth - 100)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Load all datasets on mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setLoading(true)
        const ds = await getDatasets()
        setDatasets(ds)
      } catch (error) {
        console.error('Failed to load datasets:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDatasets()
  }, [])

  // Load data when datasets are selected
  useEffect(() => {
    if (selectedDatasetIds.length === 0) {
      setDatasetsData(new Map())
      setDatasetsParameters(new Map())
      setSelectedParameters([])
      return
    }

    const loadData = async () => {
      try {
        setDataLoading(true)
        
        // Load data for all selected datasets in parallel
        const dataPromises = selectedDatasetIds.map(async (datasetId) => {
          const [params, data] = await Promise.all([
            getParameters(datasetId),
            getTimeSeriesData(datasetId)
          ])
          return { datasetId, params, data }
        })
        
        const results = await Promise.all(dataPromises)
        
        // Store data and parameters by dataset
        const newDatasetsData = new Map<number, TimeSeriesData[]>()
        const newDatasetsParameters = new Map<number, Parameter[]>()
        const newDatasetStartTimes = new Map<number, number>()
        let totalPoints = 0
        let allDates: Date[] = []
        
        results.forEach(({ datasetId, params, data }) => {
          newDatasetsData.set(datasetId, data)
          newDatasetsParameters.set(datasetId, params)
          totalPoints += data.length
          allDates = allDates.concat(data.map(d => d.timestamp))
          
          // Track each dataset's start time
          if (data.length > 0) {
            const startTime = Math.min(...data.map(d => d.timestamp.getTime()))
            newDatasetStartTimes.set(datasetId, startTime)
          }
        })
        
        setDatasetsData(newDatasetsData)
        setDatasetsParameters(newDatasetsParameters)
        setDatasetStartTimes(newDatasetStartTimes)
        
        // Calculate merged stats
        if (allDates.length > 0) {
          const minTime = Math.min(...allDates.map(d => d.getTime()))
          const maxTime = Math.max(...allDates.map(d => d.getTime()))
          
          setMergedDataStats({
            totalPoints,
            startDate: new Date(minTime),
            endDate: new Date(maxTime)
          })
        }
        
        // Select first 2 parameters from each dataset by default
        const defaultSelected: string[] = []
        results.forEach(({ datasetId, params }) => {
          params.slice(0, 2).forEach(p => {
            defaultSelected.push(`${datasetId}_${p.parameter_id}`)
          })
        })
        setSelectedParameters(defaultSelected)
        
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setDataLoading(false)
      }
    }
    
    loadData()
  }, [selectedDatasetIds])

  // Get all parameters with dataset info
  const allParameters = useMemo(() => {
    const params: ExtendedParameter[] = []
    datasetsParameters.forEach((parameters, datasetId) => {
      const dataset = datasets.find(d => d.id === datasetId)
      if (!dataset) return
      
      const color = datasetColors.get(datasetId) || new ColorRGBA(0.5, 0.5, 0.5, 1)
      
      parameters.forEach(param => {
        params.push({
          ...param,
          datasetId,
          datasetName: `${dataset.plant} - ${dataset.machine_no}`,
          datasetColor: color
        })
      })
    })
    return params
  }, [datasetsParameters, datasets, datasetColors])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (datasetsData.size === 0 || selectedParameters.length === 0) return null

    let timestamps: Float32Array
    let timestampIndexMap: Map<number, number> | null = null

    if (timeMode === 'relative') {
      // For relative time, each dataset starts at 0
      // Find the maximum duration across all datasets
      let maxDuration = 0
      datasetsData.forEach((data, datasetId) => {
        if (data.length > 0) {
          const startTime = datasetStartTimes.get(datasetId) || 0
          const endTime = Math.max(...data.map(d => d.timestamp.getTime()))
          const duration = (endTime - startTime) / 1000 // in seconds
          maxDuration = Math.max(maxDuration, duration)
        }
      })
      
      // Create a unified timestamp array from 0 to maxDuration
      const numPoints = Math.min(Math.ceil(maxDuration * 10), 10000) // Sample at 0.1s intervals, max 10k points
      timestamps = new Float32Array(numPoints)
      for (let i = 0; i < numPoints; i++) {
        timestamps[i] = (i / (numPoints - 1)) * maxDuration
      }
    } else {
      // Absolute time mode (original logic)
      const allTimestamps = new Set<number>()
      datasetsData.forEach(data => {
        data.forEach(d => {
          allTimestamps.add(d.timestamp.getTime())
        })
      })
      
      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)
      timestamps = new Float32Array(sortedTimestamps.length)
      sortedTimestamps.forEach((ts, i) => {
        timestamps[i] = ts / 1000 // Convert to seconds
      })
      
      timestampIndexMap = new Map<number, number>()
      sortedTimestamps.forEach((ts, index) => {
        timestampIndexMap!.set(ts, index)
      })
    }

    // Prepare data for each selected parameter
    interface ChartDataItem {
      parameterId: string
      parameterName: string
      unit: string
      data: Float32Array
      color: ColorRGBA
    }
    
    const chartsData: ChartDataItem[] = []
    
    selectedParameters.forEach((paramKey) => {
      const [datasetIdStr, parameterId] = paramKey.split('_')
      const datasetId = parseInt(datasetIdStr)
      
      const param = allParameters.find(p => 
        p.datasetId === datasetId && p.parameter_id === parameterId
      )
      if (!param) return

      const datasetData = datasetsData.get(datasetId)
      if (!datasetData) return

      const data = new Float32Array(timestamps.length)
      
      if (timeMode === 'relative') {
        // For relative time, normalize each dataset's timestamps individually
        const startTime = datasetStartTimes.get(datasetId) || 0
        
        // Fill with NaN initially
        for (let i = 0; i < data.length; i++) {
          data[i] = NaN
        }
        
        // Map dataset data to the unified timestamp array
        datasetData.forEach(d => {
          const relativeTime = (d.timestamp.getTime() - startTime) / 1000 // seconds from dataset start
          const value = d.parameters[parameterId]
          
          if (value !== undefined && !isNaN(value)) {
            // Find the closest timestamp index
            let closestIndex = 0
            let minDiff = Math.abs(timestamps[0] - relativeTime)
            
            for (let i = 1; i < timestamps.length; i++) {
              const diff = Math.abs(timestamps[i] - relativeTime)
              if (diff < minDiff) {
                minDiff = diff
                closestIndex = i
              } else {
                break // timestamps are sorted, so we can break early
              }
            }
            
            data[closestIndex] = value
          }
        })
        
        // Linear interpolation for missing values
        let lastValidIndex = -1
        for (let i = 0; i < data.length; i++) {
          if (!isNaN(data[i])) {
            if (lastValidIndex !== -1 && i - lastValidIndex > 1) {
              const startValue = data[lastValidIndex]
              const endValue = data[i]
              const steps = i - lastValidIndex
              for (let j = 1; j < steps; j++) {
                data[lastValidIndex + j] = startValue + (endValue - startValue) * (j / steps)
              }
            }
            lastValidIndex = i
          }
        }
      } else {
        // Absolute time mode (original logic)
        for (let i = 0; i < data.length; i++) {
          data[i] = NaN
        }
        
        datasetData.forEach(d => {
          const value = d.parameters[parameterId]
          if (value !== undefined && !isNaN(value) && timestampIndexMap) {
            const index = timestampIndexMap.get(d.timestamp.getTime())
            if (index !== undefined) {
              data[index] = value
            }
          }
        })
        
        // Linear interpolation
        let lastValidIndex = -1
        for (let i = 0; i < data.length; i++) {
          if (!isNaN(data[i])) {
            if (lastValidIndex !== -1 && i - lastValidIndex > 1) {
              const startValue = data[lastValidIndex]
              const endValue = data[i]
              const steps = i - lastValidIndex
              for (let j = 1; j < steps; j++) {
                data[lastValidIndex + j] = startValue + (endValue - startValue) * (j / steps)
              }
            }
            lastValidIndex = i
          }
        }
      }

      // Generate color with variation based on parameter
      const baseColor = param.datasetColor
      const paramIndex = allParameters.filter(p => p.datasetId === datasetId).indexOf(param)
      const variation = 0.2
      const brightness = 1 - (paramIndex * variation / 10)
      
      chartsData.push({
        parameterId: paramKey,
        parameterName: `${param.datasetName} - ${param.parameter_name}`,
        unit: param.unit,
        data,
        color: new ColorRGBA(
          baseColor.r * brightness,
          baseColor.g * brightness,
          baseColor.b * brightness,
          1
        )
      })
    })

    return { timestamps, charts: chartsData }
  }, [datasetsData, selectedParameters, allParameters, timeMode, datasetStartTimes])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">データセットを読み込み中...</div>
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          グラフを表示するには、まずCSVデータをインポートしてください。
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dataset Selection */}
      <DatasetSelector
        datasets={datasets}
        selectedDatasetIds={selectedDatasetIds}
        onSelectDataset={setSelectedDatasetIds}
      />

      {/* Chart Display */}
      {selectedDatasetIds.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          {dataLoading ? (
            <div className="text-center py-8">データを読み込み中...</div>
          ) : (
            <>
              {/* Controls */}
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">パラメータ選択</h3>
                  <div className="max-h-48 overflow-y-auto border rounded p-2">
                    {allParameters.length === 0 ? (
                      <p className="text-gray-500 text-sm">パラメータがありません</p>
                    ) : (
                      Array.from(datasetsParameters.entries()).map(([datasetId, params]) => {
                        const dataset = datasets.find(d => d.id === datasetId)
                        if (!dataset) return null
                        
                        return (
                          <div key={datasetId} className="mb-4">
                            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{
                                  backgroundColor: `rgb(${datasetColors.get(datasetId)?.r ?? 0.5 * 255}, ${datasetColors.get(datasetId)?.g ?? 0.5 * 255}, ${datasetColors.get(datasetId)?.b ?? 0.5 * 255})`
                                }}
                              />
                              {dataset.plant} - {dataset.machine_no}
                              {timeMode === 'relative' && datasetStartTimes.has(datasetId) && (
                                <span className="text-xs text-gray-500">
                                  (開始: {format(new Date(datasetStartTimes.get(datasetId)!), 'HH:mm:ss', { locale: ja })})
                                </span>
                              )}
                            </h4>
                            <div className="flex flex-wrap gap-2 ml-5">
                              {params.map((param) => {
                                const paramKey = `${datasetId}_${param.parameter_id}`
                                return (
                                  <label key={paramKey} className="flex items-center space-x-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={selectedParameters.includes(paramKey)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedParameters([...selectedParameters, paramKey])
                                        } else {
                                          setSelectedParameters(selectedParameters.filter(id => id !== paramKey))
                                        }
                                      }}
                                      className="rounded"
                                    />
                                    <span>{param.parameter_name}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimeMode('absolute')}
                      className={`px-3 py-1 rounded ${
                        timeMode === 'absolute' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      絶対時間
                    </button>
                    <button
                      onClick={() => setTimeMode('relative')}
                      className={`px-3 py-1 rounded ${
                        timeMode === 'relative' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      相対時間
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('single')}
                      className={`px-3 py-1 rounded ${
                        viewMode === 'single' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      単一表示
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded ${
                        viewMode === 'grid' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      グリッド表示
                    </button>
                  </div>
                </div>
              </div>

              {/* Reference time display for relative mode */}
              {timeMode === 'relative' && datasetStartTimes.size > 0 && (
                <div className="mb-2 text-sm text-gray-600">
                  <div className="font-medium">各データセットの開始時刻:</div>
                  {Array.from(datasetStartTimes.entries()).map(([datasetId, startTime]) => {
                    const dataset = datasets.find(d => d.id === datasetId)
                    if (!dataset) return null
                    return (
                      <div key={datasetId} className="ml-4">
                        {dataset.plant} - {dataset.machine_no}: {format(new Date(startTime), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Chart Display */}
              {chartData ? (
                <>
                  <ChartSynchronizer enabled={viewMode === 'grid'}>
                    {viewMode === 'single' ? (
                      <TimeSeriesChart
                        series={chartData.charts.map(c => ({
                          data: c.data,
                          color: c.color,
                          label: c.parameterName,
                          unit: c.unit
                        }))}
                        timestamps={chartData.timestamps}
                        width={Math.min(containerWidth, 1000)}
                        height={500}
                        timeMode={timeMode}
                      />
                    ) : (
                      <ChartGrid
                        charts={chartData.charts}
                        timestamps={chartData.timestamps}
                        rows={2}
                        cols={2}
                        synchronized={true}
                        timeMode={timeMode}
                      />
                    )}
                  </ChartSynchronizer>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    総データ点数: {mergedDataStats.totalPoints.toLocaleString()} | 
                    選択データセット: {selectedDatasetIds.length} | 
                    表示パラメータ: {selectedParameters.length}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">表示するデータがありません</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [r, g, b]
}