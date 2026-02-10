/**
 * Campaign optimization goal types
 */
export type CampaignGoal = 'reach' | 'engagement' | 'balanced';

/**
 * Input parameters for budget calculation
 */
export interface BudgetInput {
  totalBudget: number;
  durationDays: number;
  goal?: CampaignGoal;
  minChannelPercentage?: number;
  maxChannelPercentage?: number;
}

/**
 * Allocation details for a single channel
 */
export interface ChannelAllocation {
  channel: string;
  budget: number;
  percentage: number;
  cpm: number;
  estimatedImpressions: number;
  estimatedReach: number;
  dailyBudget: number;
  dailyImpressions: number;
  efficiencyScore: number;
  insight: string;
}

/**
 * Summary of the entire campaign distribution
 */
export interface BudgetSummary {
  totalBudget: number;
  durationDays: number;
  totalImpressions: number;
  totalReach: number;
  averageCpm: number;
  dailyBudget: number;
  goal: string;
  recommendation: string;
}

/**
 * Complete response from the budget calculation API
 */
export interface BudgetResult {
  allocations: ChannelAllocation[];
  summary: BudgetSummary;
  calculatedAt: string;
}

/**
 * Channel information for display
 */
export interface ChannelInfo {
  name: string;
  baseCpm: number;
  description: string;
  strengths: string[];
}

/**
 * API health check response
 */
export interface HealthCheck {
  status: string;
  timestamp: string;
  service: string;
}

