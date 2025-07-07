'use client';

import { ImportProgress } from '@/app/types/data';

interface ImportProgressProps {
  progress: ImportProgress;
}

export default function ImportProgressComponent({ progress }: ImportProgressProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  
  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'idle':
        return '準備中...';
      case 'processing':
        return `処理中... (${progress.current}/${progress.total})`;
      case 'completed':
        return '完了しました！';
      case 'error':
        return 'エラーが発生しました';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {progress.message && (
        <p className={`text-sm ${progress.status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
          {progress.message}
        </p>
      )}
    </div>
  );
}