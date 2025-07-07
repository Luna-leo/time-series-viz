'use client';

import { useState } from 'react';
import { Metadata } from '@/app/types/data';

interface MetadataFormProps {
  onSubmit: (metadata: Metadata) => void;
  disabled?: boolean;
}

export default function MetadataForm({ onSubmit, disabled = false }: MetadataFormProps) {
  const [formData, setFormData] = useState<Partial<Metadata>>({
    plant: '',
    machine_no: '',
    label: '',
    event: '',
    data_source: 'CASS'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'start' | 'end') => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value ? new Date(value) : undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.plant && formData.machine_no && formData.data_source) {
      onSubmit(formData as Metadata);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="data_source" className="block text-sm font-medium text-gray-700 mb-1">
            データソース <span className="text-red-500">*</span>
          </label>
          <select
            id="data_source"
            name="data_source"
            value={formData.data_source}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="CASS">CASS</option>
            <option value="Chinami">Chinami</option>
          </select>
        </div>

        <div>
          <label htmlFor="plant" className="block text-sm font-medium text-gray-700 mb-1">
            プラント <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="plant"
            name="plant"
            value={formData.plant}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="machine_no" className="block text-sm font-medium text-gray-700 mb-1">
            機器番号 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="machine_no"
            name="machine_no"
            value={formData.machine_no}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
            ラベル
          </label>
          <input
            type="text"
            id="label"
            name="label"
            value={formData.label}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
            イベント
          </label>
          <input
            type="text"
            id="event"
            name="event"
            value={formData.event}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
            開始日時
          </label>
          <input
            type="datetime-local"
            id="start"
            name="start"
            onChange={(e) => handleDateChange(e, 'start')}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
            終了日時
          </label>
          <input
            type="datetime-local"
            id="end"
            name="end"
            onChange={(e) => handleDateChange(e, 'end')}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || !formData.plant || !formData.machine_no}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          インポート開始
        </button>
      </div>
    </form>
  );
}