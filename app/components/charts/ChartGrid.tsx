'use client'

import { useEffect, useRef, useState } from 'react'
import TimeSeriesChart from './TimeSeriesChart'
import { ColorRGBA } from 'webgl-plot'

interface ChartData {
  parameterId: string
  parameterName: string
  unit: string
  data: Float32Array
  color: ColorRGBA
}

interface ChartGridProps {
  charts: ChartData[]
  timestamps: Float32Array
  rows?: number
  cols?: number
  chartWidth?: number
  chartHeight?: number
  synchronized?: boolean
  className?: string
  timeMode?: 'absolute' | 'relative'
}

export default function ChartGrid({
  charts,
  timestamps,
  rows = 4,
  cols = 4,
  chartWidth = 400,
  chartHeight = 300,
  synchronized = false,
  className = '',
  timeMode = 'absolute'
}: ChartGridProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedRange, setSelectedRange] = useState<[number, number] | null>(null)
  const [visibleCharts, setVisibleCharts] = useState<number[]>([])
  const gridRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!gridRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => parseInt(entry.target.getAttribute('data-index') || '0'))
        
        setVisibleCharts(prev => {
          const newVisible = [...new Set([...prev, ...visible])]
          return newVisible
        })
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    // Observe all chart containers
    const chartContainers = gridRef.current.querySelectorAll('[data-index]')
    chartContainers.forEach(container => observer.observe(container))

    return () => {
      chartContainers.forEach(container => observer.unobserve(container))
    }
  }, [charts])

  // Handle synchronized range changes
  const handleRangeChange = synchronized ? (start: number, end: number) => {
    setSelectedRange([start, end])
  } : undefined

  const maxCharts = rows * cols
  const displayCharts = charts.slice(0, maxCharts)

  return (
    <div className={`${className}`}>
      <div
        ref={gridRef}
        className={`grid gap-4`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {displayCharts.map((chart, index) => (
          <div
            key={`${chart.parameterId}-${index}`}
            data-index={index}
            className="bg-white rounded-lg shadow p-4"
          >
            <h3 className="text-sm font-semibold mb-2 truncate">
              {chart.parameterName}
            </h3>
            {visibleCharts.includes(index) ? (
              <TimeSeriesChart
                series={[{
                  data: chart.data,
                  color: chart.color,
                  label: chart.parameterName,
                  unit: chart.unit
                }]}
                timestamps={timestamps}
                width={chartWidth}
                height={chartHeight}
                onRangeChange={handleRangeChange}
                timeMode={timeMode}
              />
            ) : (
              <div
                className="bg-gray-100 animate-pulse rounded"
                style={{ width: chartWidth, height: chartHeight }}
              />
            )}
          </div>
        ))}
      </div>
      
      {charts.length > maxCharts && (
        <div className="mt-4 text-center text-sm text-gray-500">
          表示中: {maxCharts} / {charts.length} チャート
        </div>
      )}
    </div>
  )
}