export function validateCsvFile(file: File): string | null {
  if (!file) {
    return 'ファイルが選択されていません。';
  }
  
  const validExtensions = ['.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return 'CSVファイルを選択してください。';
  }
  
  const maxSizeInMB = 100;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (file.size > maxSizeInBytes) {
    return `ファイルサイズが大きすぎます。${maxSizeInMB}MB以下のファイルを選択してください。`;
  }
  
  return null;
}

export function validateMetadata(metadata: {
  plant?: string;
  machine_no?: string;
}): string | null {
  if (!metadata.plant || metadata.plant.trim() === '') {
    return 'プラント名は必須です。';
  }
  
  if (!metadata.machine_no || metadata.machine_no.trim() === '') {
    return '機器番号は必須です。';
  }
  
  return null;
}