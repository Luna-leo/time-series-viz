/**
 * Downsamples data using the Largest Triangle Three Buckets (LTTB) algorithm
 * This algorithm preserves the visual characteristics of the data while reducing the number of points
 * 
 * @param data Array of [x, y] coordinates
 * @param threshold Target number of points after downsampling
 * @returns Downsampled array of [x, y] coordinates
 */
export function lttbDownsample(data: [number, number][], threshold: number): [number, number][] {
  if (data.length <= threshold || threshold < 3) {
    return data
  }

  const sampled: [number, number][] = []
  const bucketSize = (data.length - 2) / (threshold - 2)

  // Always include the first point
  sampled.push(data[0])

  // Last selected point (initially the first point)
  let lastSelectedPoint = 0

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length)

    // Calculate average point for the next bucket
    let avgX = 0
    let avgY = 0
    let avgCount = 0

    for (let j = bucketEnd; j < nextBucketEnd; j++) {
      avgX += data[j][0]
      avgY += data[j][1]
      avgCount++
    }

    if (avgCount > 0) {
      avgX /= avgCount
      avgY /= avgCount
    }

    // Find the point in the current bucket with the largest triangle area
    let maxArea = -1
    let maxAreaIndex = -1

    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      // Calculate triangle area using the last selected point, current point, and average next point
      const area = Math.abs(
        (data[lastSelectedPoint][0] - avgX) * (data[j][1] - data[lastSelectedPoint][1]) -
        (data[lastSelectedPoint][0] - data[j][0]) * (avgY - data[lastSelectedPoint][1])
      ) * 0.5

      if (area > maxArea) {
        maxArea = area
        maxAreaIndex = j
      }
    }

    if (maxAreaIndex !== -1) {
      sampled.push(data[maxAreaIndex])
      lastSelectedPoint = maxAreaIndex
    }
  }

  // Always include the last point
  sampled.push(data[data.length - 1])

  return sampled
}

/**
 * Simple decimation downsampling - takes every nth point
 * Faster but less visually accurate than LTTB
 * 
 * @param data Array of values
 * @param maxPoints Maximum number of points to return
 * @returns Downsampled array
 */
export function decimateDownsample(data: Float32Array, maxPoints: number): Float32Array {
  if (data.length <= maxPoints) {
    return data
  }

  const sampleRate = Math.ceil(data.length / maxPoints)
  const sampledLength = Math.floor(data.length / sampleRate)
  const sampled = new Float32Array(sampledLength)

  for (let i = 0; i < sampledLength; i++) {
    sampled[i] = data[i * sampleRate]
  }

  return sampled
}

/**
 * Binary search to find the closest index for a given value in a sorted array
 * Used for efficient timestamp matching in relative time calculations
 * 
 * @param arr Sorted array to search
 * @param target Target value to find
 * @returns Index of the closest value
 */
export function binarySearchClosest(arr: Float32Array, target: number): number {
  if (arr.length === 0) return -1
  if (target <= arr[0]) return 0
  if (target >= arr[arr.length - 1]) return arr.length - 1

  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (arr[mid] === target) {
      return mid
    }

    if (arr[mid] < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  // At this point, left > right
  // Check which of arr[right] and arr[left] is closer to target
  if (left >= arr.length) return right
  if (right < 0) return left

  const leftDiff = Math.abs(arr[left] - target)
  const rightDiff = Math.abs(arr[right] - target)

  return leftDiff < rightDiff ? left : right
}

/**
 * Checks if data needs sampling based on the number of points
 * 
 * @param dataLength Number of data points
 * @param threshold Maximum points before sampling (default: 10000)
 * @returns Whether sampling is needed
 */
export function needsSampling(dataLength: number, threshold: number = 10000): boolean {
  return dataLength > threshold
}