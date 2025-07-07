import Papa from 'papaparse';
import { CsvHeader, CsvRow, ParsedCsvFile } from '@/app/types/csv';
import { convertToUtf8, getEncodingByDataSource } from '@/app/lib/utils/encoding';

export async function parseCsvFile(
  file: File,
  dataSource: 'CASS' | 'Chinami'
): Promise<ParsedCsvFile> {
  const encoding = getEncodingByDataSource(dataSource);
  let csvText = await convertToUtf8(file, encoding);
  
  // BOM除去処理
  if (csvText.charCodeAt(0) === 0xFEFF) {
    csvText = csvText.substring(1);
  }
  
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 4) {
    throw new Error('CSVファイルのフォーマットが不正です。最低4行（ヘッダー3行 + データ1行）必要です。');
  }
  
  const parameterIds = lines[0].split(',').map(s => s.trim());
  const parameterNames = lines[1].split(',').map(s => s.trim());
  const units = lines[2].split(',').map(s => s.trim());
  
  // 1列目が空でもタイムスタンプ列として扱う（実際のデータ行にタイムスタンプがあることを前提）
  if (parameterIds[0] && 
      parameterIds[0].toLowerCase() !== 'timestamp' && 
      parameterIds[0].toLowerCase() !== 'time' &&
      parameterIds[0].toLowerCase() !== 'datetime' &&
      parameterIds[0] !== '') {
    throw new Error('1列目はタイムスタンプ列である必要があります。');
  }
  
  const headers: CsvHeader[] = [];
  for (let i = 1; i < parameterIds.length; i++) {
    const parameterId = parameterIds[i];
    const parameterName = parameterNames[i] || '-';
    const unit = units[i] || '-';
    
    if (parameterId && parameterId !== '-') {
      headers.push({
        parameter_id: parameterId,
        parameter_name: parameterName,
        unit: unit
      });
    }
  }
  
  const dataLines = lines.slice(3).join('\n');
  
  const result = Papa.parse<string[]>(dataLines, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV解析中に警告が発生しました:', result.errors);
  }
  
  const data = result.data.map((row): CsvRow => {
    const obj: CsvRow = { timestamp: String(row[0]) };
    
    for (let i = 1; i < row.length && i <= headers.length; i++) {
      const header = headers[i - 1];
      if (header) {
        obj[header.parameter_id] = row[i];
      }
    }
    
    return obj;
  });
  
  return { headers, data };
}

export function filterValidParameters(headers: CsvHeader[]): CsvHeader[] {
  return headers.filter(header => 
    header.parameter_name !== '-' || header.unit !== '-'
  );
}