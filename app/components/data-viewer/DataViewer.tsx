'use client';

import { useState, useEffect, useCallback } from 'react';
import DataFilter from './DataFilter';
import DataTable from './DataTable';
import DataDetail from './DataDetail';
import { DataSet } from '@/app/types/data';
import { getDatasets, deleteDataset } from '@/app/lib/db/operations';

export default function DataViewer() {
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<DataSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);

  const loadDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDatasets();
      setDatasets(data);
      setFilteredDatasets(data);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const handleView = (dataset: DataSet) => {
    if (dataset.id) {
      setSelectedDatasetId(dataset.id);
    }
  };

  const handleDelete = async (dataset: DataSet) => {
    if (!dataset.id) return;
    
    if (window.confirm(`${dataset.plant} - ${dataset.machine_no} のデータを削除しますか？`)) {
      try {
        await deleteDataset(dataset.id);
        await loadDatasets();
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('データの削除に失敗しました。');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">データ一覧</h2>
          
          <DataFilter 
            datasets={datasets} 
            onFilterChange={setFilteredDatasets} 
          />
          
          <div className="mt-6">
            <div className="mb-2 text-sm text-gray-600">
              {filteredDatasets.length} / {datasets.length} 件のデータ
            </div>
            <DataTable 
              datasets={filteredDatasets}
              onView={handleView}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
      
      {selectedDatasetId && (
        <DataDetail
          datasetId={selectedDatasetId}
          onClose={() => setSelectedDatasetId(null)}
        />
      )}
    </>
  );
}