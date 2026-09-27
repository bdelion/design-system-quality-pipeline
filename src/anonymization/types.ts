import type { RawDataset } from '../domain/types.js';
export interface AnonymizationOptions { seed: string; dateOffsetDays: number; strictText: boolean; preserveComponentNames: boolean; urlBase: string; }
export interface AnonymizationReport { repositories:number; issues:number; pullRequests:number; components:number; ownersAnonymized:number; repositoryNamesAnonymized:number; idsAnonymized:number; datesShifted:number; textsSanitized:number; suspiciousStrings:number; warnings:string[]; }
export interface AnonymizationResult { dataset: RawDataset; report: AnonymizationReport; }
export const DEFAULT_ANONYMIZATION_OPTIONS: AnonymizationOptions = { seed:'design-system-quality-pipeline', dateOffsetDays:-365, strictText:true, preserveComponentNames:true, urlBase:'https://fixture.invalid' };
