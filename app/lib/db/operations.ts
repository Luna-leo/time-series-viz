import { db } from './schema';
import { DataSet, TimeSeriesData, Parameter, Metadata } from '@/app/types/data';
import { WideFormatData } from '@/app/types/csv';

export async function createDataset(metadata: Metadata): Promise<number> {
  const dataset: DataSet = {
    ...metadata,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  return await db.datasets.add(dataset);
}

export async function saveTimeSeriesData(
  datasetId: number,
  data: WideFormatData[],
  parameterInfo: Map<string, { name: string; unit: string }>
): Promise<void> {
  const timeSeriesData: TimeSeriesData[] = [];
  const parameters: Parameter[] = [];
  const parameterSet = new Set<string>();

  for (const row of data) {
    const { timestamp, ...params } = row;
    
    const parameters: Record<string, number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number' && !isNaN(value)) {
        parameters[key] = value;
        parameterSet.add(key);
      }
    }
    
    if (Object.keys(parameters).length > 0) {
      timeSeriesData.push({
        dataset_id: datasetId,
        timestamp: timestamp,
        parameters: parameters
      });
    }
  }

  for (const parameterId of parameterSet) {
    const info = parameterInfo.get(parameterId);
    if (info) {
      parameters.push({
        dataset_id: datasetId,
        parameter_id: parameterId,
        parameter_name: info.name,
        unit: info.unit
      });
    }
  }

  await db.transaction('rw', db.timeSeriesData, db.parameters, async () => {
    await db.timeSeriesData.bulkAdd(timeSeriesData);
    await db.parameters.bulkAdd(parameters);
  });
}

export async function getDatasets(): Promise<DataSet[]> {
  return await db.datasets.toArray();
}

export async function getDatasetById(id: number): Promise<DataSet | undefined> {
  return await db.datasets.get(id);
}

export async function getTimeSeriesData(
  datasetId: number,
  startTime?: Date,
  endTime?: Date
): Promise<TimeSeriesData[]> {
  const query = db.timeSeriesData.where('dataset_id').equals(datasetId);
  
  if (startTime || endTime) {
    const data = await query.toArray();
    return data.filter(d => {
      if (startTime && d.timestamp < startTime) return false;
      if (endTime && d.timestamp > endTime) return false;
      return true;
    });
  }
  
  return await query.toArray();
}

export async function getParameters(datasetId: number): Promise<Parameter[]> {
  return await db.parameters.where('dataset_id').equals(datasetId).toArray();
}

export async function deleteDataset(id: number): Promise<void> {
  await db.transaction('rw', db.datasets, db.timeSeriesData, db.parameters, async () => {
    await db.datasets.delete(id);
    await db.timeSeriesData.where('dataset_id').equals(id).delete();
    await db.parameters.where('dataset_id').equals(id).delete();
  });
}