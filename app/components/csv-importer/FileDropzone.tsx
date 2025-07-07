'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFilesSelected, disabled = false }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    disabled,
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <svg
        className="mx-auto h-12 w-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      {isDragActive ? (
        <p className="text-blue-500 font-medium">ドロップしてファイルを追加</p>
      ) : (
        <div>
          <p className="text-gray-600 mb-1">CSVファイルをドラッグ＆ドロップ</p>
          <p className="text-sm text-gray-500">または クリックして選択</p>
        </div>
      )}
    </div>
  );
}