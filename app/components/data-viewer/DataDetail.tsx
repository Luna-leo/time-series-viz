'use client';

import { useState, useEffect } from 'react';
import { DataSet, TimeSeriesData, Parameter } from '@/app/types/data';
import { getDatasetById, getTimeSeriesData, getParameters } from '@/app/lib/db/operations';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DataDetailProps {
  datasetId: number;
  onClose: () => void;
}

export default function DataDetail({ datasetId, onClose }: DataDetailProps) {
  const [dataset, setDataset] = useState<DataSet | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataStats, setDataStats] = useState({
    totalPoints: 0,
    startDate: null as Date | null,
    endDate: null as Date | null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // データセット情報を取得
        const ds = await getDatasetById(datasetId);
        if (!ds) {
          console.error('Dataset not found');
          return;
        }
        setDataset(ds);

        // パラメータ情報を取得
        const params = await getParameters(datasetId);
        setParameters(params);

        // 時系列データを取得（最初の100件）
        const tsData = await getTimeSeriesData(datasetId);
        const limitedData = tsData.slice(0, 100);
        setTimeSeriesData(limitedData);

        // データ統計を計算
        if (tsData.length > 0) {
          const dates = tsData.map(d => d.timestamp);
          setDataStats({
            totalPoints: tsData.length,
            startDate: new Date(Math.min(...dates.map(d => d.getTime()))),
            endDate: new Date(Math.max(...dates.map(d => d.getTime())))
          });
        }
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [datasetId]);


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">データ詳細</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* 基本情報 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">基本情報</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">プラント</p>
                <p className="font-medium">{dataset.plant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">機器番号</p>
                <p className="font-medium">{dataset.machine_no}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">データソース</p>
                <p className="font-medium">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dataset.data_source === 'CASS' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {dataset.data_source}
                  </span>
                </p>
              </div>
              {dataset.label && (
                <div>
                  <p className="text-sm text-gray-600">ラベル</p>
                  <p className="font-medium">{dataset.label}</p>
                </div>
              )}
              {dataset.event && (
                <div>
                  <p className="text-sm text-gray-600">イベント</p>
                  <p className="font-medium">{dataset.event}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="font-medium">
                  {format(dataset.created_at, 'yyyy/MM/dd HH:mm', { locale: ja })}
                </p>
              </div>
            </div>
          </div>

          {/* データサマリー */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">データサマリー</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">総データ点数</p>
                <p className="font-medium">{dataStats.totalPoints.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">パラメータ数</p>
                <p className="font-medium">{parameters.length}</p>
              </div>
              {dataStats.startDate && (
                <div>
                  <p className="text-sm text-gray-600">開始日時</p>
                  <p className="font-medium">
                    {format(dataStats.startDate, 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </p>
                </div>
              )}
              {dataStats.endDate && (
                <div>
                  <p className="text-sm text-gray-600">終了日時</p>
                  <p className="font-medium">
                    {format(dataStats.endDate, 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* パラメータ一覧 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">パラメータ一覧</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {parameters.map((param) => (
                  <div key={param.parameter_id} className="text-sm">
                    <span className="font-mono text-gray-600">{param.parameter_id}:</span>{' '}
                    <span className="font-medium">{param.parameter_name}</span>{' '}
                    <span className="text-gray-500">({param.unit})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 時系列データプレビュー */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              データプレビュー（最初の{Math.min(100, timeSeriesData.length)}件）
            </h3>
            <div className="overflow-x-auto bg-gray-50 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100">
                      タイムスタンプ
                    </th>
                    {parameters.slice(0, 10).map((param) => (
                      <th 
                        key={param.parameter_id} 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {param.parameter_id}
                        <br />
                        <span className="text-gray-400 normal-case">({param.unit})</span>
                      </th>
                    ))}
                    {parameters.length > 10 && (
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        他 {parameters.length - 10} パラメータ
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSeriesData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white">
                        {format(data.timestamp, 'yyyy/MM/dd HH:mm:ss')}
                      </td>
                      {parameters.slice(0, 10).map((param) => (
                        <td key={param.parameter_id} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {data.parameters[param.parameter_id]?.toFixed(2) || '-'}
                        </td>
                      ))}
                      {parameters.length > 10 && (
                        <td className="px-4 py-2 text-center text-sm text-gray-500">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}