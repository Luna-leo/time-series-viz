'use client'

import { DataSet } from '@/app/types/data'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DatasetSelectorProps {
  datasets: DataSet[]
  selectedDatasetId: number | null
  onSelectDataset: (id: number | null) => void
}

export default function DatasetSelector({
  datasets,
  selectedDatasetId,
  onSelectDataset
}: DatasetSelectorProps) {
  
  const handleSelectDataset = (datasetId: number) => {
    if (selectedDatasetId === datasetId) {
      // Deselect if already selected
      onSelectDataset(null)
    } else {
      // Select new dataset
      onSelectDataset(datasetId)
    }
  }

  const handleClear = () => {
    onSelectDataset(null)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">データセット選択</h2>
        <div className="flex gap-2">
          {selectedDatasetId && (
            <>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                選択解除
              </button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                1件選択中
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => {
          const isSelected = selectedDatasetId === dataset.id
          
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
                  type="radio"
                  name="dataset-selection"
                  checked={isSelected}
                  onChange={() => handleSelectDataset(dataset.id!)}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div 
                  className="flex-1"
                  onClick={() => handleSelectDataset(dataset.id!)}
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