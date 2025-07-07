'use client'

import { useState, useEffect, useMemo } from 'react'
import { DataSet, TimeSeriesData, Parameter } from '@/app/types/data'
import { getDatasets, getTimeSeriesData, getParameters } from '@/app/lib/db/operations'
import { ColorRGBA } from 'webgl-plot'
import TimeSeriesChart from '../charts/TimeSeriesChart'
import ChartGrid from '../charts/ChartGrid'
import { ChartSynchronizer } from '../charts/ChartSynchronizer'
import DatasetSelector from './DatasetSelector'
import AxisParameterSelector from './AxisParameterSelector'
import XYChart from '../charts/XYChart'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'


export default function GraphViewer() {
  const [containerWidth, setContainerWidth] = useState(1000)
  const [datasets, setDatasets] = useState<DataSet[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null)
  const [datasetData, setDatasetData] = useState<TimeSeriesData[]>([])
  const [datasetParameters, setDatasetParameters] = useState<Parameter[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [graphMode, setGraphMode] = useState<'xy' | 'timeseries'>('xy')
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const [timeMode] = useState<'absolute' | 'relative'>('absolute')
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [xAxisParam, setXAxisParam] = useState<string | null>(null)
  const [yAxisParam, setYAxisParam] = useState<string | null>(null)
  const [xyPlotType, setXyPlotType] = useState<'line' | 'scatter'>('line')
  const [pointSize, setPointSize] = useState(3)
  const [dataStats, setDataStats] = useState({
    totalPoints: 0,
    startDate: null as Date | null,
    endDate: null as Date | null
  })

  // Get dataset color
  const datasetColor = useMemo(() => {
    if (!selectedDatasetId) return new ColorRGBA(0.5, 0.5, 0.5, 1)
    const index = datasets.findIndex(d => d.id === selectedDatasetId)
    const hue = (index * 137.5) % 360 // Golden angle for good color distribution
    const rgb = hslToRgb(hue / 360, 0.6, 0.5)
    return new ColorRGBA(rgb[0], rgb[1], rgb[2], 1)
  }, [datasets, selectedDatasetId])

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
      setDatasetData([])
      setDatasetParameters([])
      setSelectedParameters([])
      setXAxisParam(null)
      setYAxisParam(null)
      return
    }

    const loadData = async () => {
      try {
        setDataLoading(true)
        
        // Load data for selected dataset
        const [params, data] = await Promise.all([
          getParameters(selectedDatasetId),
          getTimeSeriesData(selectedDatasetId)
        ])
        
        setDatasetData(data)
        setDatasetParameters(params)
        
        // Calculate stats
        if (data.length > 0) {
          const dates = data.map(d => d.timestamp)
          const minTime = Math.min(...dates.map(d => d.getTime()))
          const maxTime = Math.max(...dates.map(d => d.getTime()))
          
          setDataStats({
            totalPoints: data.length,
            startDate: new Date(minTime),
            endDate: new Date(maxTime)
          })
        }
        
        // Set default selections
        if (params.length >= 2) {
          setXAxisParam(params[0].parameter_id)
          setYAxisParam(params[1].parameter_id)
          setSelectedParameters([params[0].parameter_id, params[1].parameter_id])
        } else if (params.length === 1) {
          setXAxisParam(params[0].parameter_id)
          setSelectedParameters([params[0].parameter_id])
        }
        
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setDataLoading(false)
      }
    }
    
    loadData()
  }, [selectedDatasetId])

  // Prepare XY chart data
  const xyChartData = useMemo(() => {
    if (!xAxisParam || !yAxisParam || datasetData.length === 0) return null
    
    const xData = new Float32Array(datasetData.length)
    const yData = new Float32Array(datasetData.length)
    let validCount = 0
    
    // Extract X and Y data
    datasetData.forEach((d) => {
      const xValue = d.parameters[xAxisParam]
      const yValue = d.parameters[yAxisParam]
      
      if (xValue !== undefined && !isNaN(xValue) && yValue !== undefined && !isNaN(yValue)) {
        xData[validCount] = xValue
        yData[validCount] = yValue
        validCount++
      }
    })
    
    // Trim arrays to valid data
    const trimmedXData = xData.slice(0, validCount)
    const trimmedYData = yData.slice(0, validCount)
    
    const xParam = datasetParameters.find(p => p.parameter_id === xAxisParam)
    const yParam = datasetParameters.find(p => p.parameter_id === yAxisParam)
    
    if (!xParam || !yParam) return null
    
    return {
      xData: trimmedXData,
      yData: trimmedYData,
      xLabel: xParam.parameter_name,
      yLabel: yParam.parameter_name,
      xUnit: xParam.unit,
      yUnit: yParam.unit
    }
  }, [xAxisParam, yAxisParam, datasetData, datasetParameters])

  // Prepare time series chart data
  const timeSeriesChartData = useMemo(() => {
    if (datasetData.length === 0 || selectedParameters.length === 0 || graphMode !== 'timeseries') return null

    // Create timestamps array
    const timestamps = new Float32Array(datasetData.length)
    datasetData.forEach((d, i) => {
      timestamps[i] = d.timestamp.getTime() / 1000 // Convert to seconds
    })

    // Prepare data for each selected parameter
    const chartsData = selectedParameters.map(parameterId => {
      const param = datasetParameters.find(p => p.parameter_id === parameterId)
      if (!param) return null
      
      const data = new Float32Array(datasetData.length)
      datasetData.forEach((d, i) => {
        const value = d.parameters[parameterId]
        data[i] = value !== undefined && !isNaN(value) ? value : NaN
      })
      
      return {
        parameterId,
        parameterName: param.parameter_name,
        unit: param.unit,
        data,
        color: datasetColor
      }
    }).filter(Boolean) as {
      parameterId: string
      parameterName: string
      unit: string
      data: Float32Array
      color: ColorRGBA
    }[]

    return { timestamps, charts: chartsData }
  }, [datasetData, selectedParameters, datasetParameters, graphMode, datasetColor])

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
      {/* Graph Mode Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold">グラフモード:</span>
          <button
            onClick={() => setGraphMode('xy')}
            className={`px-4 py-2 rounded ${
              graphMode === 'xy' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            XYグラフ
          </button>
          <button
            onClick={() => setGraphMode('timeseries')}
            className={`px-4 py-2 rounded ${
              graphMode === 'timeseries' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            時系列グラフ
          </button>
        </div>
      </div>

      {/* Dataset Selection */}
      <DatasetSelector
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={setSelectedDatasetId}
      />

      {/* Parameter Selection and Chart Display */}
      {selectedDatasetId && (
        <>
          {dataLoading ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center text-gray-500">データを読み込み中...</div>
            </div>
          ) : (
            <>
              {/* Parameter Selection */}
              {graphMode === 'xy' ? (
                <AxisParameterSelector
                  parameters={datasetParameters}
                  xAxisParam={xAxisParam}
                  yAxisParam={yAxisParam}
                  onXAxisChange={setXAxisParam}
                  onYAxisChange={setYAxisParam}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">パラメータ選択</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {datasetParameters.map((param) => (
                      <label key={param.parameter_id} className="flex items-center space-x-2">
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
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          {param.parameter_name}
                          {param.unit && ` (${param.unit})`}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {/* View mode controls for time series */}
                  <div className="mt-4 flex gap-2">
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
              )}

              {/* XY Plot Type Selection */}
              {graphMode === 'xy' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">表示タイプ:</span>
                      <button
                        onClick={() => setXyPlotType('line')}
                        className={`px-3 py-1 rounded ${
                          xyPlotType === 'line' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        線グラフ
                      </button>
                      <button
                        onClick={() => setXyPlotType('scatter')}
                        className={`px-3 py-1 rounded ${
                          xyPlotType === 'scatter' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        散布図
                      </button>
                    </div>
                    
                    {/* Point Size Slider for Scatter Plot */}
                    {xyPlotType === 'scatter' && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">ポイントサイズ:</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={pointSize}
                          onChange={(e) => setPointSize(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{pointSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chart Display */}
              <div className="bg-white rounded-lg shadow p-6">
                {graphMode === 'xy' && xyChartData ? (
                  <div className="relative">
                    <XYChart
                      xData={xyChartData.xData}
                      yData={xyChartData.yData}
                      xLabel={xyChartData.xLabel}
                      yLabel={xyChartData.yLabel}
                      xUnit={xyChartData.xUnit}
                      yUnit={xyChartData.yUnit}
                      color={datasetColor}
                      width={Math.min(containerWidth, 1000)}
                      height={600}
                      plotType={xyPlotType}
                      pointSize={pointSize}
                    />
                  </div>
                ) : graphMode === 'timeseries' && timeSeriesChartData ? (
                  <ChartSynchronizer enabled={viewMode === 'grid'}>
                    {viewMode === 'single' ? (
                      <TimeSeriesChart
                        series={timeSeriesChartData.charts.map(c => ({
                          data: c.data,
                          color: c.color,
                          label: c.parameterName,
                          unit: c.unit
                        }))}
                        timestamps={timeSeriesChartData.timestamps}
                        width={Math.min(containerWidth, 1000)}
                        height={500}
                        timeMode={timeMode}
                      />
                    ) : (
                      <ChartGrid
                        charts={timeSeriesChartData.charts}
                        timestamps={timeSeriesChartData.timestamps}
                        rows={2}
                        cols={2}
                        synchronized={true}
                        timeMode={timeMode}
                      />
                    )}
                  </ChartSynchronizer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {graphMode === 'xy' 
                      ? 'X軸とY軸のパラメータを選択してください' 
                      : '表示するパラメータを選択してください'}
                  </div>
                )}
                
                {/* Data Stats */}
                {(xyChartData || timeSeriesChartData) && (
                  <div className="mt-4 text-sm text-gray-500">
                    総データ点数: {dataStats.totalPoints.toLocaleString()}
                    {dataStats.startDate && dataStats.endDate && (
                      <> | 期間: {format(dataStats.startDate, 'yyyy/MM/dd HH:mm', { locale: ja })} - {format(dataStats.endDate, 'yyyy/MM/dd HH:mm', { locale: ja })}</>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
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