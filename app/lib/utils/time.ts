/**
 * Format elapsed time in seconds to human-readable format
 * @param seconds - Elapsed time in seconds
 * @returns Formatted string (e.g., "0s", "1m 30s", "2h 15m", "3d 12h")
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 0) return '0s'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (days > 0) {
    if (hours > 0) {
      return `${days}d ${hours}h`
    }
    return `${days}d`
  }
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${hours}h`
  }
  
  if (minutes > 0) {
    if (secs > 0 && minutes < 10) {
      return `${minutes}m ${secs}s`
    }
    return `${minutes}m`
  }
  
  return `${secs}s`
}

/**
 * Convert absolute timestamps to relative timestamps (elapsed time from start)
 * @param timestamps - Array of absolute timestamps in seconds
 * @param startTime - Reference start time in seconds
 * @returns Array of relative timestamps in seconds
 */
export function convertToRelativeTime(timestamps: Float32Array, startTime: number): Float32Array {
  const relativeTimestamps = new Float32Array(timestamps.length)
  
  for (let i = 0; i < timestamps.length; i++) {
    relativeTimestamps[i] = timestamps[i] - startTime
  }
  
  return relativeTimestamps
}

/**
 * Find the earliest timestamp from multiple datasets
 * @param datasetsData - Map of dataset ID to time series data
 * @returns Earliest timestamp in milliseconds
 */
export function findEarliestTimestamp(datasetsData: Map<number, Array<{ timestamp: Date }>>): number {
  let earliestTime = Infinity
  
  datasetsData.forEach(data => {
    if (data.length > 0) {
      const minTime = Math.min(...data.map(d => d.timestamp.getTime()))
      if (minTime < earliestTime) {
        earliestTime = minTime
      }
    }
  })
  
  return earliestTime === Infinity ? Date.now() : earliestTime
}

/**
 * Generate time axis labels for a given range
 * @param minTime - Minimum time in seconds
 * @param maxTime - Maximum time in seconds
 * @param numLabels - Approximate number of labels to generate
 * @returns Array of {value: number, label: string} for axis labels
 */
export function generateTimeAxisLabels(
  minTime: number, 
  maxTime: number, 
  numLabels: number = 5
): Array<{ value: number; label: string }> {
  const range = maxTime - minTime
  const step = range / (numLabels - 1)
  const labels: Array<{ value: number; label: string }> = []
  
  for (let i = 0; i < numLabels; i++) {
    const value = minTime + step * i
    labels.push({
      value,
      label: formatElapsedTime(value)
    })
  }
  
  return labels
}