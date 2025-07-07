'use client'

import { useEffect, useRef } from 'react'
import { WebglPlot, WebglLine, ColorRGBA } from 'webgl-plot'

interface ChartSeries {
  data: Float32Array
  color: ColorRGBA
  label: string
  unit?: string
}

interface TimeSeriesChartProps {
  series: ChartSeries[]
  timestamps: Float32Array
  width?: number
  height?: number
  className?: string
  onRangeChange?: (start: number, end: number) => void
}

export default function TimeSeriesChart({
  series,
  timestamps,
  width = 800,
  height = 400,
  className = ''
}: TimeSeriesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plotRef = useRef<WebglPlot | null>(null)
  const linesRef = useRef<WebglLine[]>([])
  const animationRef = useRef<number | null>(null)

  // Initialize WebGL plot
  useEffect(() => {
    if (!canvasRef.current || !series.length || !timestamps.length) return

    console.log('TimeSeriesChart: Initializing with', series.length, 'series and', timestamps.length, 'timestamps')

    const canvas = canvasRef.current
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // Set canvas dimensions with device pixel ratio
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)

    try {
      // Create WebGL plot
      const plot = new WebglPlot(canvas)
      plotRef.current = plot

      // Clear previous lines
      linesRef.current = []

      // Create lines for each series
      series.forEach((s) => {
        if (!s.data || s.data.length === 0) return

        // Sample data if too many points
        const maxPoints = 10000 // Maximum points per line
        let sampledData = s.data
        let sampleRate = 1
        
        if (s.data.length > maxPoints) {
          sampleRate = Math.ceil(s.data.length / maxPoints)
          const sampledLength = Math.floor(s.data.length / sampleRate)
          sampledData = new Float32Array(sampledLength)
          
          for (let i = 0; i < sampledLength; i++) {
            sampledData[i] = s.data[i * sampleRate]
          }
          
          console.log(`Sampled data from ${s.data.length} to ${sampledLength} points (rate: ${sampleRate})`)
        }

        // Create line with number of points
        const line = new WebglLine(s.color, sampledData.length)
        
        // Arrange X coordinates (normalized between -1 and 1)
        line.arrangeX()
        
        // Find min and max values for Y normalization
        let minY = Infinity
        let maxY = -Infinity
        for (let i = 0; i < sampledData.length; i++) {
          if (sampledData[i] < minY) minY = sampledData[i]
          if (sampledData[i] > maxY) maxY = sampledData[i]
        }
        
        // Set Y values (normalized between -1 and 1)
        const range = maxY - minY || 1
        for (let i = 0; i < sampledData.length; i++) {
          const normalizedY = ((sampledData[i] - minY) / range) * 2 - 1
          line.setY(i, normalizedY)
        }
        
        console.log(`Line created: ${s.label}, points: ${sampledData.length}, Y range: [${minY}, ${maxY}]`)

        // Add line to plot
        plot.addLine(line)
        linesRef.current.push(line)
      })

      console.log(`WebGL plot initialized with ${linesRef.current.length} lines`)

      // Start animation loop
      const animate = () => {
        if (plotRef.current) {
          plotRef.current.update()
        }
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()

    } catch (error) {
      console.error('Failed to initialize WebGL plot:', error)
      // Show error message in canvas
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ff0000'
        ctx.font = '16px Arial'
        ctx.fillText('Error initializing WebGL', 10, 30)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        ctx.fillText(errorMessage, 10, 50)
      }
    }

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (plotRef.current) {
        // Clean up WebGL resources
        plotRef.current = null
      }
    }
  }, [series, timestamps, width, height])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded"
      />
      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded shadow">
        {series.map((s, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-1"
              style={{
                backgroundColor: `rgba(${s.color.r * 255}, ${s.color.g * 255}, ${s.color.b * 255}, ${s.color.a})`
              }}
            />
            <span>{s.label}</span>
            {s.unit && <span className="text-gray-500">({s.unit})</span>}
          </div>
        ))}
      </div>
    </div>
  )
}