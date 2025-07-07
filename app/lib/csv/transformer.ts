import { parse, isValid } from 'date-fns';
import { CsvHeader, ParsedCsvFile, LongFormatData, WideFormatData } from '@/app/types/csv';

export function convertToLongFormat(
  parsedCsv: ParsedCsvFile,
  validHeaders: CsvHeader[]
): LongFormatData[] {
  const longFormatData: LongFormatData[] = [];
  
  for (const row of parsedCsv.data) {
    const timestamp = parseTimestamp(row.timestamp);
    if (!timestamp) continue;
    
    for (const header of validHeaders) {
      const value = row[header.parameter_id];
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        longFormatData.push({
          timestamp,
          parameter_id: header.parameter_id,
          parameter_name: header.parameter_name,
          unit: header.unit,
          value: Number(value)
        });
      }
    }
  }
  
  return longFormatData;
}

export function mergeLongFormatData(
  dataArrays: LongFormatData[][]
): LongFormatData[] {
  const merged: LongFormatData[] = [];
  const seen = new Set<string>();
  
  for (const dataArray of dataArrays) {
    for (const data of dataArray) {
      const key = `${data.timestamp.getTime()}_${data.parameter_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(data);
      }
    }
  }
  
  return merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function convertToWideFormat(
  longFormatData: LongFormatData[]
): { data: WideFormatData[], parameterInfo: Map<string, { name: string; unit: string }> } {
  const wideFormatMap = new Map<number, WideFormatData>();
  const parameterInfo = new Map<string, { name: string; unit: string }>();
  
  for (const item of longFormatData) {
    const timestampKey = item.timestamp.getTime();
    
    if (!wideFormatMap.has(timestampKey)) {
      wideFormatMap.set(timestampKey, {
        timestamp: item.timestamp
      });
    }
    
    const row = wideFormatMap.get(timestampKey)!;
    row[item.parameter_id] = item.value;
    
    if (!parameterInfo.has(item.parameter_id)) {
      parameterInfo.set(item.parameter_id, {
        name: item.parameter_name,
        unit: item.unit
      });
    }
  }
  
  const data = Array.from(wideFormatMap.values())
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return { data, parameterInfo };
}

function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  
  const patterns = [
    'yyyy-MM-dd HH:mm:ss',
    'yyyy/MM/dd HH:mm:ss',
    'yyyy-MM-dd HH:mm:ss.SSS',
    'yyyy/MM/dd HH:mm:ss.SSS',
    'dd/MM/yyyy HH:mm:ss',
    'MM/dd/yyyy HH:mm:ss',
  ];
  
  for (const pattern of patterns) {
    try {
      const date = parse(String(value), pattern, new Date());
      if (isValid(date)) {
        return date;
      }
    } catch {
      continue;
    }
  }
  
  try {
    const date = new Date(String(value));
    if (isValid(date)) {
      return date;
    }
  } catch {
    return null;
  }
  
  return null;
}