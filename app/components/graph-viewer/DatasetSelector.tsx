'use client'

import { DataSet } from '@/app/types/data'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DatasetSelectorProps {
  datasets: DataSet[]
  selectedDatasetId: number | null
  onSelectDataset: (id: number) => void
}

export default function DatasetSelector({
  datasets,
  selectedDatasetId,
  onSelectDataset
}: DatasetSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">データセット選択</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            onClick={() => onSelectDataset(dataset.id!)}
            className={`
              border rounded-lg p-4 cursor-pointer transition-all
              ${selectedDatasetId === dataset.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
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
        ))}
      </div>
      
      {datasets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          表示可能なデータセットがありません
        </div>
      )}
    </div>
  )
}