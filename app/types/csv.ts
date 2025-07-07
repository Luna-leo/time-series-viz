export interface CsvHeader {
  parameter_id: string;
  parameter_name: string;
  unit: string;
}

export interface CsvRow {
  timestamp: string;
  [parameter_id: string]: string | number;
}

export interface ParsedCsvFile {
  headers: CsvHeader[];
  data: CsvRow[];
}

export interface CsvFileInput {
  file: File;
  dataSource: 'CASS' | 'Chinami';
}

export interface LongFormatData {
  timestamp: Date;
  parameter_id: string;
  parameter_name: string;
  unit: string;
  value: number;
}

export interface WideFormatData {
  timestamp: Date;
  [parameter_id: string]: Date | number;
}