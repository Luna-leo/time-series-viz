'use client'

import { Parameter } from '@/app/types/data'

interface AxisParameterSelectorProps {
  parameters: Parameter[]
  xAxisParam: string | null
  yAxisParam: string | null
  onXAxisChange: (paramId: string) => void
  onYAxisChange: (paramId: string) => void
}

export default function AxisParameterSelector({
  parameters,
  xAxisParam,
  yAxisParam,
  onXAxisChange,
  onYAxisChange
}: AxisParameterSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">パラメータ選択</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* X軸パラメータ選択 */}
        <div>
          <label htmlFor="x-axis-select" className="block text-sm font-medium text-gray-700 mb-2">
            X軸パラメータ
          </label>
          <select
            id="x-axis-select"
            value={xAxisParam || ''}
            onChange={(e) => onXAxisChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">選択してください</option>
            {parameters.map((param) => (
              <option key={param.parameter_id} value={param.parameter_id}>
                {param.parameter_name}
                {param.unit && ` (${param.unit})`}
              </option>
            ))}
          </select>
          {xAxisParam && (
            <p className="mt-1 text-sm text-gray-600">
              単位: {parameters.find(p => p.parameter_id === xAxisParam)?.unit || '-'}
            </p>
          )}
        </div>

        {/* Y軸パラメータ選択 */}
        <div>
          <label htmlFor="y-axis-select" className="block text-sm font-medium text-gray-700 mb-2">
            Y軸パラメータ
          </label>
          <select
            id="y-axis-select"
            value={yAxisParam || ''}
            onChange={(e) => onYAxisChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">選択してください</option>
            {parameters
              .filter(param => param.parameter_id !== xAxisParam) // X軸と重複しないようにフィルタ
              .map((param) => (
                <option key={param.parameter_id} value={param.parameter_id}>
                  {param.parameter_name}
                  {param.unit && ` (${param.unit})`}
                </option>
              ))}
          </select>
          {yAxisParam && (
            <p className="mt-1 text-sm text-gray-600">
              単位: {parameters.find(p => p.parameter_id === yAxisParam)?.unit || '-'}
            </p>
          )}
        </div>
      </div>

      {/* 選択状態の表示 */}
      {xAxisParam && yAxisParam && (
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          <p className="font-medium text-blue-900">
            グラフ表示: {parameters.find(p => p.parameter_id === xAxisParam)?.parameter_name} vs {parameters.find(p => p.parameter_id === yAxisParam)?.parameter_name}
          </p>
        </div>
      )}
    </div>
  )
}