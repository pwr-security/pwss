export type MetricKey = 'AR' | 'EF' | 'OP' | 'DR' | 'AS' | 'CF' | 'IN' | 'AV' | 'SF' | 'SC';
export type Metrics = Record<MetricKey, string>;

export interface PwssResult {
  vector: string;
  likelihood: { points: number; level: string };
  impact: { harm: number; level: string };
  score: number;
  severity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export const VERSION: string;
export const PREFIX: string;
export const METRIC_ORDER: MetricKey[];
export const METRICS: Record<MetricKey, { name: string; values: string[] }>;
export const IMPACT_LEVELS: string[];
export function severityOf(score: number): PwssResult['severity'];
export function parseVector(vector: string): Metrics;
export function formatVector(metrics: Metrics): string;
export function score(input: string | Metrics): PwssResult;
