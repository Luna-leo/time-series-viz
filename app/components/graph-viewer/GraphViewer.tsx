'use client'

import { useState, useEffect, useMemo } from 'react'
import { DataSet, TimeSeriesData, Parameter } from '@/app/types/data'
import { getDatasets, getTimeSeriesData, getParameters } from '@/app/lib/db/operations'
import { ColorRGBA } from 'webgl-plot'
import TimeSeriesChart from '../charts/TimeSeriesChart'
import ChartGrid from '../charts/ChartGrid'
import { ChartSynchronizer } from '../charts/ChartSynchronizer'
import DatasetSelector from './DatasetSelector'

export default function GraphViewer() {
  const [containerWidth, setContainerWidth] = useState(1000)
  const [datasets, setDatasets] = useState<DataSet[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null)
  const [allData, setAllData] = useState<TimeSeriesData[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [dataStats, setDataStats] = useState({
    totalPoints: 0,
    startDate: null as Date | null,
    endDate: null as Date | null
  })

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

  // Load data when dataset is selected
  useEffect(() => {
    if (!selectedDatasetId) {
      setAllData([])
      setParameters([])
      return
    }

    const loadData = async () => {
      try {
        setDataLoading(true)
        
        // Load parameters
        const params = await getParameters(selectedDatasetId)
        setParameters(params)
        
        // Load time series data
        const data = await getTimeSeriesData(selectedDatasetId)
        setAllData(data)
        
        // Calculate stats
        if (data.length > 0) {
          const dates = data.map(d => d.timestamp)
          setDataStats({
            totalPoints: data.length,
            startDate: new Date(Math.min(...dates.map(d => d.getTime()))),
            endDate: new Date(Math.max(...dates.map(d => d.getTime())))
          })
        }
        
        // Select first 4 parameters by default
        setSelectedParameters(params.slice(0, 4).map(p => p.parameter_id))
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setDataLoading(false)
      }
    }
    
    loadData()
  }, [selectedDatasetId])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!allData.length || !selectedParameters.length) return null

    // Convert timestamps to Float32Array
    const timestamps = new Float32Array(allData.length)
    allData.forEach((d, i) => {
      timestamps[i] = d.timestamp.getTime() / 1000 // Convert to seconds
    })

    // Generate colors for parameters
    const colors = generateColors(parameters.length)

    // Prepare data for each parameter
    interface ChartDataItem {
      parameterId: string
      parameterName: string
      unit: string
      data: Float32Array
      color: ColorRGBA
    }
    
    const chartsData: ChartDataItem[] = []
    
    selectedParameters.forEach((paramId) => {
      const param = parameters.find(p => p.parameter_id === paramId)
      if (!param) return

      const data = new Float32Array(allData.length)
      allData.forEach((d, i) => {
        data[i] = d.parameters[paramId] || 0
      })

      chartsData.push({
        parameterId: paramId,
        parameterName: param.parameter_name,
        unit: param.unit,
        data,
        color: colors[parameters.findIndex(p => p.parameter_id === paramId)]
      })
    })

    return { timestamps, charts: chartsData }
  }, [allData, selectedParameters, parameters])

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
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={setSelectedDatasetId}
      />

      {/* Chart Display */}
      {selectedDatasetId && (
        <div className="bg-white rounded-lg shadow p-6">
          {dataLoading ? (
            <div className="text-center py-8">データを読み込み中...</div>
          ) : (
            <>
              {/* Controls */}
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">パラメータ選択</h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {parameters.map((param) => (
                      <label key={param.parameter_id} className="flex items-center space-x-1 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedParameters.includes(param.parameter_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParameters([...selectedParameters, param.parameter_id])
                            } else {
                              setSelectedParameters(selectedParameters.filter(id => id !== param.parameter_id))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{param.parameter_name}</span>
                      </label>
                    ))}
                  </div>
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
                      />
                    ) : (
                      <ChartGrid
                        charts={chartData.charts}
                        timestamps={chartData.timestamps}
                        rows={2}
                        cols={2}
                        synchronized={true}
                      />
                    )}
                  </ChartSynchronizer>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    総データ点数: {dataStats.totalPoints.toLocaleString()} | 
                    表示中: {allData.length.toLocaleString()} 点
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

// Helper function to generate colors
function generateColors(count: number): ColorRGBA[] {
  const colors: ColorRGBA[] = []
  const hueStep = 360 / count
  
  for (let i = 0; i < count; i++) {
    const hue = i * hueStep
    const rgb = hslToRgb(hue / 360, 0.7, 0.5)
    colors.push(new ColorRGBA(rgb[0], rgb[1], rgb[2], 1))
  }
  
  return colors
}

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