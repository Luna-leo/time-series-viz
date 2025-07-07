'use client';

import { useState, useEffect } from 'react';
import { DataSet } from '@/app/types/data';

interface DataFilterProps {
  datasets: DataSet[];
  onFilterChange: (filtered: DataSet[]) => void;
}

export default function DataFilter({ datasets, onFilterChange }: DataFilterProps) {
  const [filters, setFilters] = useState({
    plant: '',
    machine_no: '',
    label: '',
    event: '',
    data_source: '' as '' | 'CASS' | 'Chinami'
  });

  useEffect(() => {
    const filtered = datasets.filter(dataset => {
      if (filters.plant && !dataset.plant.toLowerCase().includes(filters.plant.toLowerCase())) {
        return false;
      }
      if (filters.machine_no && !dataset.machine_no.toLowerCase().includes(filters.machine_no.toLowerCase())) {
        return false;
      }
      if (filters.label && dataset.label && !dataset.label.toLowerCase().includes(filters.label.toLowerCase())) {
        return false;
      }
      if (filters.event && dataset.event && !dataset.event.toLowerCase().includes(filters.event.toLowerCase())) {
        return false;
      }
      if (filters.data_source && dataset.data_source !== filters.data_source) {
        return false;
      }
      return true;
    });
    
    onFilterChange(filtered);
  }, [filters, datasets, onFilterChange]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      plant: '',
      machine_no: '',
      label: '',
      event: '',
      data_source: ''
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">フィルター</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          クリア
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label htmlFor="filter-plant" className="block text-xs font-medium text-gray-600 mb-1">
            プラント
          </label>
          <input
            type="text"
            id="filter-plant"
            name="plant"
            value={filters.plant}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="検索..."
          />
        </div>
        
        <div>
          <label htmlFor="filter-machine_no" className="block text-xs font-medium text-gray-600 mb-1">
            機器番号
          </label>
          <input
            type="text"
            id="filter-machine_no"
            name="machine_no"
            value={filters.machine_no}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="検索..."
          />
        </div>
        
        <div>
          <label htmlFor="filter-data_source" className="block text-xs font-medium text-gray-600 mb-1">
            データソース
          </label>
          <select
            id="filter-data_source"
            name="data_source"
            value={filters.data_source}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="CASS">CASS</option>
            <option value="Chinami">Chinami</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="filter-label" className="block text-xs font-medium text-gray-600 mb-1">
            ラベル
          </label>
          <input
            type="text"
            id="filter-label"
            name="label"
            value={filters.label}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="検索..."
          />
        </div>
        
        <div>
          <label htmlFor="filter-event" className="block text-xs font-medium text-gray-600 mb-1">
            イベント
          </label>
          <input
            type="text"
            id="filter-event"
            name="event"
            value={filters.event}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="検索..."
          />
        </div>
      </div>
    </div>
  );
}