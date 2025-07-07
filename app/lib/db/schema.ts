import Dexie, { Table } from 'dexie';
import { DataSet, TimeSeriesData, Parameter } from '@/app/types/data';

export class TimeSeriesDatabase extends Dexie {
  datasets!: Table<DataSet>;
  timeSeriesData!: Table<TimeSeriesData>;
  parameters!: Table<Parameter>;

  constructor() {
    super('TimeSeriesDB');
    
    this.version(1).stores({
      datasets: '++id, [plant+machine_no], created_at',
      timeSeriesData: '++id, dataset_id, timestamp',
      parameters: '++id, dataset_id, parameter_id'
    });
  }
}

export const db = new TimeSeriesDatabase();