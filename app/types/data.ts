export type DataSource = 'CASS' | 'Chinami';

export interface Metadata {
  plant: string;
  machine_no: string;
  label?: string;
  event?: string;
  start?: Date;
  end?: Date;
  data_source: DataSource;
}

export interface DataSet extends Metadata {
  id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface TimeSeriesData {
  id?: number;
  dataset_id: number;
  timestamp: Date;
  parameters: Record<string, number>;
}

export interface Parameter {
  id?: number;
  dataset_id: number;
  parameter_id: string;
  parameter_name: string;
  unit: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message?: string;
}