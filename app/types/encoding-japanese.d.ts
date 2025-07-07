declare module 'encoding-japanese' {
  export interface ConvertOptions {
    to: string;
    from: string;
  }
  
  export function convert(data: Uint8Array | number[], options: ConvertOptions): number[];
  export function codeToString(data: number[]): string;
}