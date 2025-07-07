import * as Encoding from 'encoding-japanese';

export async function convertToUtf8(file: File, sourceEncoding: 'SJIS' | 'UTF8'): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  if (sourceEncoding === 'UTF8') {
    return new TextDecoder('utf-8').decode(uint8Array);
  }
  
  const unicodeArray = Encoding.convert(uint8Array, {
    to: 'UNICODE',
    from: 'SJIS'
  });
  
  return Encoding.codeToString(unicodeArray);
}

export function getEncodingByDataSource(dataSource: 'CASS' | 'Chinami'): 'SJIS' | 'UTF8' {
  return dataSource === 'CASS' ? 'SJIS' : 'UTF8';
}