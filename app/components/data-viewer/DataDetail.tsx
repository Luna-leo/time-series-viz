'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataSet, TimeSeriesData, Parameter } from '@/app/types/data';
import { getDatasetById, getTimeSeriesData, getParameters } from '@/app/lib/db/operations';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ColorRGBA } from 'webgl-plot';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import ChartGrid from '../charts/ChartGrid';
import { ChartSynchronizer } from '../charts/ChartSynchronizer';

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
  const [activeTab, setActiveTab] = useState<'info' | 'chart'>('info');

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
          
          {/* Tab Navigation */}
          <div className="mt-4 flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              基本情報
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chart'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              グラフ表示
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'info' ? (
            <>
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
            </>
          ) : (
            <ChartTab 
              datasetId={datasetId}
              parameters={parameters}
              timeSeriesData={timeSeriesData}
              dataStats={dataStats}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Chart Tab Component
interface ChartTabProps {
  datasetId: number;
  parameters: Parameter[];
  timeSeriesData: TimeSeriesData[];
  dataStats: {
    totalPoints: number;
    startDate: Date | null;
    endDate: Date | null;
  };
}

function ChartTab({ datasetId, parameters, dataStats }: ChartTabProps) {
  const [allData, setAllData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);

  // Load all data for charts
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const data = await getTimeSeriesData(datasetId);
        setAllData(data);
        // Select first 4 parameters by default
        setSelectedParameters(parameters.slice(0, 4).map(p => p.parameter_id));
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [datasetId, parameters]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!allData.length || !selectedParameters.length) return null;

    // Convert timestamps to Float32Array
    const timestamps = new Float32Array(allData.length);
    allData.forEach((d, i) => {
      timestamps[i] = d.timestamp.getTime() / 1000; // Convert to seconds
    });

    // Generate colors for parameters
    const colors = generateColors(parameters.length);

    // Prepare data for each parameter
    interface ChartDataItem {
      parameterId: string;
      parameterName: string;
      unit: string;
      data: Float32Array;
      color: ColorRGBA;
    }
    
    const chartsData: ChartDataItem[] = [];
    
    selectedParameters.forEach((paramId) => {
      const param = parameters.find(p => p.parameter_id === paramId);
      if (!param) return;

      const data = new Float32Array(allData.length);
      allData.forEach((d, i) => {
        data[i] = d.parameters[paramId] || 0;
      });

      chartsData.push({
        parameterId: paramId,
        parameterName: param.parameter_name,
        unit: param.unit,
        data,
        color: colors[parameters.findIndex(p => p.parameter_id === paramId)]
      });
    });

    return { timestamps, charts: chartsData };
  }, [allData, selectedParameters, parameters]);

  if (loading) {
    return <div className="text-center py-8">データを読み込み中...</div>;
  }

  if (!chartData) {
    return <div className="text-center py-8">表示するデータがありません</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">パラメータ選択</h3>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {parameters.map((param) => (
              <label key={param.parameter_id} className="flex items-center space-x-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedParameters.includes(param.parameter_id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedParameters([...selectedParameters, param.parameter_id]);
                    } else {
                      setSelectedParameters(selectedParameters.filter(id => id !== param.parameter_id));
                    }
                  }}
                  className="rounded"
                />
                <span>{param.parameter_name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('single')}
            className={`px-3 py-1 rounded ${
              viewMode === 'single' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            単一表示
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${
              viewMode === 'grid' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            グリッド表示
          </button>
        </div>
      </div>

      {/* Chart Display */}
      <ChartSynchronizer enabled={viewMode === 'grid'}>
        {viewMode === 'single' ? (
          <TimeSeriesChart
            series={chartData.charts.map(c => ({
              data: c.data,
              color: c.color,
              label: c.parameterName,
              unit: c.unit
            }))}
            timestamps={chartData.timestamps}
            width={1000}
            height={500}
          />
        ) : (
          <ChartGrid
            charts={chartData.charts}
            timestamps={chartData.timestamps}
            rows={2}
            cols={2}
            synchronized={true}
          />
        )}
      </ChartSynchronizer>
      
      <div className="mt-4 text-sm text-gray-500">
        総データ点数: {dataStats.totalPoints.toLocaleString()} | 
        表示中: {allData.length.toLocaleString()} 点
      </div>
    </div>
  );
}

// Helper function to generate colors
function generateColors(count: number): ColorRGBA[] {
  const colors: ColorRGBA[] = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    const hue = i * hueStep;
    const rgb = hslToRgb(hue / 360, 0.7, 0.5);
    colors.push(new ColorRGBA(rgb[0], rgb[1], rgb[2], 1));
  }
  
  return colors;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r, g, b];
}