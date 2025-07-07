'use client';

import { useState } from 'react';
import FileDropzone from './FileDropzone';
import MetadataForm from './MetadataForm';
import ImportProgressComponent from './ImportProgress';
import { Metadata, ImportProgress } from '@/app/types/data';
import { parseCsvFile, filterValidParameters } from '@/app/lib/csv/parser';
import { convertToLongFormat, mergeLongFormatData, convertToWideFormat } from '@/app/lib/csv/transformer';
import { validateCsvFile } from '@/app/lib/csv/validator';
import { createDataset, saveTimeSeriesData } from '@/app/lib/db/operations';

export default function CsvImporter() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    status: 'idle'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const validFiles = files.filter(file => !validateCsvFile(file));
    if (validFiles.length === 0) {
      setProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: '有効なCSVファイルが選択されていません。'
      });
      return;
    }
    setSelectedFiles(validFiles);
    setProgress({ current: 0, total: 0, status: 'idle' });
  };

  const handleImport = async (metadata: Metadata) => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setProgress({
      current: 0,
      total: selectedFiles.length,
      status: 'processing',
      message: 'CSVファイルを解析しています...'
    });

    try {
      const longFormatArrays: ReturnType<typeof convertToLongFormat>[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        setProgress({
          current: i,
          total: selectedFiles.length,
          status: 'processing',
          message: `ファイル ${i + 1}/${selectedFiles.length} を処理中: ${file.name}`
        });

        try {
          const parsedCsv = await parseCsvFile(file, metadata.data_source);
          const validHeaders = filterValidParameters(parsedCsv.headers);
          
          if (validHeaders.length === 0) {
            console.warn(`${file.name}: 有効なパラメータが見つかりませんでした。`);
            continue;
          }

          const longFormatData = convertToLongFormat(parsedCsv, validHeaders);
          longFormatArrays.push(longFormatData);
        } catch (error) {
          console.error(`ファイル処理エラー (${file.name}):`, error);
          throw new Error(`${file.name} の処理中にエラーが発生しました: ${error}`);
        }
      }

      if (longFormatArrays.length === 0) {
        throw new Error('有効なデータが見つかりませんでした。');
      }

      setProgress({
        current: selectedFiles.length,
        total: selectedFiles.length + 2,
        status: 'processing',
        message: 'データを結合しています...'
      });

      const mergedLongFormat = mergeLongFormatData(longFormatArrays);
      const { data: wideFormatData, parameterInfo } = convertToWideFormat(mergedLongFormat);

      if (wideFormatData.length === 0) {
        throw new Error('変換後のデータが空です。');
      }

      setProgress({
        current: selectedFiles.length + 1,
        total: selectedFiles.length + 2,
        status: 'processing',
        message: 'データベースに保存しています...'
      });

      const datasetId = await createDataset(metadata);
      await saveTimeSeriesData(datasetId, wideFormatData, parameterInfo);

      setProgress({
        current: selectedFiles.length + 2,
        total: selectedFiles.length + 2,
        status: 'completed',
        message: `${wideFormatData.length}件のデータをインポートしました。`
      });

      setTimeout(() => {
        setSelectedFiles([]);
        setProgress({ current: 0, total: 0, status: 'idle' });
      }, 3000);

    } catch (error) {
      console.error('インポートエラー:', error);
      setProgress({
        current: progress.current,
        total: progress.total,
        status: 'error',
        message: error instanceof Error ? error.message : 'インポート中にエラーが発生しました。'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">CSVファイルの選択</h2>
        <FileDropzone 
          onFilesSelected={handleFilesSelected} 
          disabled={isProcessing}
        />
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              選択されたファイル ({selectedFiles.length}件)
            </h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFiles(files => files.filter((_, i) => i !== index));
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="削除"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">メタ情報の入力</h2>
          <MetadataForm 
            onSubmit={handleImport} 
            disabled={isProcessing}
          />
        </div>
      )}

      {progress.status !== 'idle' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">インポート進捗</h2>
          <ImportProgressComponent progress={progress} />
        </div>
      )}
    </div>
  );
}