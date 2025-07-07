'use client';

import { useState } from 'react';
import CsvImporter from './components/csv-importer/CsvImporter';
import DataViewer from './components/data-viewer/DataViewer';
import GraphViewer from './components/graph-viewer/GraphViewer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'import' | 'view' | 'graph'>('import');

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Series Visualization</h1>
        
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'import'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              CSVインポート
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'view'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              データ一覧
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'graph'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              グラフ
            </button>
          </nav>
        </div>
        
        <div>
          {activeTab === 'import' ? (
            <CsvImporter />
          ) : activeTab === 'view' ? (
            <DataViewer />
          ) : (
            <GraphViewer />
          )}
        </div>
      </div>
    </main>
  );
}