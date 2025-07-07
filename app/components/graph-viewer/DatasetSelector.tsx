'use client'

import { DataSet } from '@/app/types/data'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DatasetSelectorProps {
  datasets: DataSet[]
  selectedDatasetIds: number[]
  onSelectDataset: (ids: number[]) => void
}

export default function DatasetSelector({
  datasets,
  selectedDatasetIds,
  onSelectDataset
}: DatasetSelectorProps) {
  
  const handleToggleDataset = (datasetId: number) => {
    if (selectedDatasetIds.includes(datasetId)) {
      // Remove from selection
      onSelectDataset(selectedDatasetIds.filter(id => id !== datasetId))
    } else {
      // Add to selection
      onSelectDataset([...selectedDatasetIds, datasetId])
    }
  }

  const handleSelectAll = () => {
    const allIds = datasets.map(d => d.id!).filter(id => id !== undefined)
    onSelectDataset(allIds)
  }

  const handleClearAll = () => {
    onSelectDataset([])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">データセット選択</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            すべて選択
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            選択解除
          </button>
          {selectedDatasetIds.length > 0 && (
            <span className="px-3 py-1 text-sm bg-gray-100 rounded">
              {selectedDatasetIds.length}件選択中
            </span>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => {
          const isSelected = selectedDatasetIds.includes(dataset.id!)
          
          return (
            <div
              key={dataset.id}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleDataset(dataset.id!)}
                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div 
                  className="flex-1"
                  onClick={() => handleToggleDataset(dataset.id!)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{dataset.plant}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dataset.data_source === 'CASS' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {dataset.data_source}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>機器番号: {dataset.machine_no}</p>
                    {dataset.label && <p>ラベル: {dataset.label}</p>}
                    {dataset.event && <p>イベント: {dataset.event}</p>}
                    {dataset.start && dataset.end && (
                      <p>
                        期間: {format(dataset.start, 'yyyy/MM/dd', { locale: ja })} - {' '}
                        {format(dataset.end, 'yyyy/MM/dd', { locale: ja })}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      作成日: {format(dataset.created_at, 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {datasets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          表示可能なデータセットがありません
        </div>
      )}
    </div>
  )
}