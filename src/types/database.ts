export interface FxRate {
  id: string;
  code: string;
  bid_value: number;
  ask_value: number;
  pct_change: number;
  timestamp: string;
  created_at: string;
}

export interface CommoditySetting {
  id: string;
  user_id: string;
  asset_name: string;
  target_currency: string;
  target_price: number | null;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export type InsightType = 'Opportunity' | 'Risk';
export type IndicatorType = 'Bullish' | 'Bearish' | 'Neutral';

export interface FxInsight {
  id: string;
  type: InsightType;
  message: string;
  indicator: IndicatorType;
  currency_code: string | null;
  commodity: string | null;
  created_at: string;
}

export interface IntegrationLog {
  id: string;
  workflow_id: string;
  status_code: number;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}
