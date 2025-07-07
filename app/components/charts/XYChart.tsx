'use client'

import { useEffect, useRef } from 'react'
import { WebglPlot, WebglLine, WebglSquare, ColorRGBA } from 'webgl-plot'

interface XYChartProps {
  xData: Float32Array
  yData: Float32Array
  xLabel: string
  yLabel: string
  xUnit: string
  yUnit: string
  color?: ColorRGBA
  width?: number
  height?: number
  plotType?: 'scatter' | 'line'
  pointSize?: number
  className?: string
}

export default function XYChart({
  xData,
  yData,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  color = new ColorRGBA(0.2, 0.5, 0.8, 1),
  width = 800,
  height = 600,
  plotType = 'line',
  pointSize = 3,
  className = ''
}: XYChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plotRef = useRef<WebglPlot | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !xData || !yData || xData.length === 0 || yData.length === 0) return
    if (xData.length !== yData.length) {
      console.error('XYChart: xData and yData must have the same length')
      return
    }

    console.log(`XYChart: Initializing with ${xData.length} data points`)

    const canvas = canvasRef.current
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // Set canvas dimensions with device pixel ratio
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    try {
      // Create WebGL plot
      const plot = new WebglPlot(canvas)
      plotRef.current = plot

      // Sample data if too many points
      const maxPoints = 10000
      let sampledXData = xData
      let sampledYData = yData
      
      if (xData.length > maxPoints) {
        const sampleRate = Math.ceil(xData.length / maxPoints)
        const sampledLength = Math.floor(xData.length / sampleRate)
        sampledXData = new Float32Array(sampledLength)
        sampledYData = new Float32Array(sampledLength)
        
        for (let i = 0; i < sampledLength; i++) {
          sampledXData[i] = xData[i * sampleRate]
          sampledYData[i] = yData[i * sampleRate]
        }
        
        console.log(`Sampled data from ${xData.length} to ${sampledLength} points`)
      }

      // Find min and max values for normalization
      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity
      
      for (let i = 0; i < sampledXData.length; i++) {
        if (!isNaN(sampledXData[i])) {
          if (sampledXData[i] < minX) minX = sampledXData[i]
          if (sampledXData[i] > maxX) maxX = sampledXData[i]
        }
        if (!isNaN(sampledYData[i])) {
          if (sampledYData[i] < minY) minY = sampledYData[i]
          if (sampledYData[i] > maxY) maxY = sampledYData[i]
        }
      }

      const rangeX = maxX - minX || 1
      const rangeY = maxY - minY || 1

      if (plotType === 'scatter') {
        // Create scatter plot using squares
        const normalizedPointSize = pointSize / Math.min(width, height) * 2 // Normalize point size
        
        for (let i = 0; i < sampledXData.length; i++) {
          const normalizedX = ((sampledXData[i] - minX) / rangeX) * 2 - 1
          const normalizedY = ((sampledYData[i] - minY) / rangeY) * 2 - 1
          
          const square = new WebglSquare(color)
          // Create a square centered at the data point
          square.setSquare(
            normalizedX - normalizedPointSize / 2,
            normalizedY - normalizedPointSize / 2,
            normalizedX + normalizedPointSize / 2,
            normalizedY + normalizedPointSize / 2
          )
          plot.addSurface(square)
        }
      } else {
        // Create line plot
        const line = new WebglLine(color, sampledXData.length)
        
        // Set X and Y values (normalized between -1 and 1)
        for (let i = 0; i < sampledXData.length; i++) {
          const normalizedX = ((sampledXData[i] - minX) / rangeX) * 2 - 1
          const normalizedY = ((sampledYData[i] - minY) / rangeY) * 2 - 1
          line.setX(i, normalizedX)
          line.setY(i, normalizedY)
        }

        // Add line to plot
        plot.addLine(line)
      }

      console.log(`XYChart initialized (${plotType}): X range [${minX}, ${maxX}], Y range [${minY}, ${maxY}]`)

      // Start animation loop
      const animate = () => {
        if (plotRef.current) {
          plotRef.current.update()
        }
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()

      // Store ranges for axis labels
      const axisData = {
        minX, maxX, minY, maxY
      }
      ;(canvas as unknown as { axisData: typeof axisData }).axisData = axisData

    } catch (error) {
      console.error('Failed to initialize XY plot:', error)
    }

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (plotRef.current) {
        plotRef.current = null
      }
    }
  }, [xData, yData, color, width, height, plotType, pointSize])

  // Get axis data for labels
  const getAxisLabels = () => {
    if (!canvasRef.current) return { xLabels: [], yLabels: [] }
    
    const axisData = (canvasRef.current as unknown as { axisData?: { minX: number; maxX: number; minY: number; maxY: number } })?.axisData
    if (!axisData) return { xLabels: [], yLabels: [] }
    
    const { minX, maxX, minY, maxY } = axisData
    
    // Generate 5 labels for each axis
    const xLabels = []
    const yLabels = []
    
    for (let i = 0; i < 5; i++) {
      const xValue = minX + (maxX - minX) * (i / 4)
      const yValue = minY + (maxY - minY) * (i / 4)
      
      xLabels.push(xValue.toFixed(2))
      yLabels.push(yValue.toFixed(2))
    }
    
    return { xLabels, yLabels }
  }

  const { xLabels, yLabels } = getAxisLabels()

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded"
      />
      
      {/* Axis labels */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2 text-xs text-gray-600">
        {xLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      
      <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between py-2 text-xs text-gray-600">
        {yLabels.reverse().map((label, index) => (
          <span key={index} className="text-right w-10">{label}</span>
        ))}
      </div>
      
      {/* Axis titles */}
      <div className="absolute -bottom-14 left-0 right-0 text-center text-sm text-gray-700">
        {xLabel} {xUnit && `(${xUnit})`}
      </div>
      
      <div 
        className="absolute -left-20 top-0 bottom-0 flex items-center text-sm text-gray-700"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {yLabel} {yUnit && `(${yUnit})`}
      </div>

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded shadow">
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-4 h-1"
            style={{
              backgroundColor: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`
            }}
          />
          <span>{xLabel} vs {yLabel}</span>
        </div>
      </div>
    </div>
  )
}