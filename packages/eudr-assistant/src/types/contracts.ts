// Enterprise Interface Contracts (PROJECT.md)

export interface SpatialConflictResult {
  hasConflict: boolean;
  conflictType?: 'EXACT_DUPLICATE' | 'POLYGON_OVERLAP' | 'DEFORESTATION_ENCROACHMENT';
  overlapAreaHectares?: number;
  overlapPercentage?: number;
  conflictingSupplierIds?: string[];
  affectedPlotIds: string[];
  remediationAdvice: string;
}

export interface ExecutiveExportService<TInput, TOutput> {
  generate(input: TInput): Promise<TOutput>;
  download(output: TOutput, filename: string): void;
}
