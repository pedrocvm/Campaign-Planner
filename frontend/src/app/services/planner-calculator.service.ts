import { Injectable } from '@angular/core';
import {
  PlannerInput,
  PlannerResult,
  ChannelAllocationResult,
  ValidationResult,
  ChannelSettings,
  PlannerInsight,
} from '../models/planner.models';
import {
  CHANNEL_CONFIGS,
  GOAL_WEIGHTS,
  WARNING_THRESHOLDS,
  getChannelById,
} from '../config/campaign-config';
import { CampaignGoal } from '../models/campaign.models';

@Injectable({
  providedIn: 'root',
})
export class PlannerCalculatorService {
  /**
   * Validate input constraints before calculation
   */
  validateConstraints(input: PlannerInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const enabledChannels = input.channelSettings.filter((c) => c.enabled);

    if (enabledChannels.length === 0) {
      errors.push('At least one channel must be enabled');
      return { isValid: false, errors, warnings };
    }

    // Validate per-channel min <= max
    for (const channel of enabledChannels) {
      if (channel.minPercent > channel.maxPercent) {
        const config = getChannelById(channel.channelId);
        errors.push(
          `${config?.label || channel.channelId}: Min (${channel.minPercent}%) cannot exceed Max (${channel.maxPercent}%)`
        );
      }
    }

    // Sum of mins must be <= 100
    const sumMins = enabledChannels.reduce((acc, c) => acc + c.minPercent, 0);
    if (sumMins > 100) {
      errors.push(
        `Sum of minimum percentages (${sumMins}%) exceeds 100%. Reduce some minimums.`
      );
    }

    // Sum of maxs must be >= 100
    const sumMaxs = enabledChannels.reduce((acc, c) => acc + c.maxPercent, 0);
    if (sumMaxs < 100) {
      errors.push(
        `Sum of maximum percentages (${sumMaxs}%) is below 100%. Increase some maximums.`
      );
    }

    // Budget validation
    if (input.totalBudget < 100) {
      errors.push('Minimum budget is $100');
    }

    // Duration validation
    if (input.durationDays < 1 || input.durationDays > 365) {
      errors.push('Duration must be between 1 and 365 days');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Main calculation method
   */
  calculatePlan(input: PlannerInput): PlannerResult | null {
    const validation = this.validateConstraints(input);
    if (!validation.isValid) {
      return null;
    }

    const enabledChannels = input.channelSettings.filter((c) => c.enabled);

    // Step 1: Calculate scores for each channel
    const channelScores = this.calculateChannelScores(enabledChannels, input.goal);

    // Step 2: Apply allocation algorithm
    let allocations = this.distributeByScore(
      enabledChannels,
      channelScores,
      input.totalBudget,
      input.durationDays
    );

    // Step 3: Apply Video/Display bias if set
    if (input.videoDisplayBias && input.videoDisplayBias !== 0) {
      allocations = this.applyVideoDisplayBias(
        allocations,
        enabledChannels,
        input.videoDisplayBias
      );
    }

    // Step 4: Calculate metrics for each allocation
    allocations = this.calculateMetrics(allocations, input.durationDays);

    // Step 5: Generate insights
    const insights = this.generateInsights(allocations, input);

    // Step 6: Build summary
    const summary = this.buildSummary(allocations, input);

    return {
      allocations,
      summary,
      insights,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate score for each channel based on goal
   */
  private calculateChannelScores(
    channels: ChannelSettings[],
    goal: CampaignGoal
  ): Map<string, number> {
    const scores = new Map<string, number>();
    const weights = GOAL_WEIGHTS[goal];

    for (const channel of channels) {
      const config = getChannelById(channel.channelId);
      if (!config) continue;

      const cpm = channel.cpmOverride ?? config.defaultCPM;

      // Score formula:
      // - CPM component: 1/CPM (lower CPM = higher score)
      // - Engagement component: engagementWeight / CPM
      const cpmScore = (1 / cpm) * weights.cpmWeight;
      const engScore = (config.engagementWeight / cpm) * weights.engagementWeight;

      scores.set(channel.channelId, cpmScore + engScore);
    }

    return scores;
  }

  /**
   * Distribute budget proportionally by score, respecting min/max
   */
  private distributeByScore(
    channels: ChannelSettings[],
    scores: Map<string, number>,
    totalBudget: number,
    durationDays: number
  ): ChannelAllocationResult[] {
    // Step 1: Assign minimums to all channels
    const allocations: ChannelAllocationResult[] = channels.map((channel) => {
      const config = getChannelById(channel.channelId);
      return {
        channelId: channel.channelId,
        percentage: channel.minPercent,
        budget: 0,
        dailyBudget: 0,
        cpmUsed: channel.cpmOverride ?? config?.defaultCPM ?? 10,
        frequencyUsed: channel.frequencyOverride ?? config?.defaultFrequency ?? 4,
        impressions: 0,
        reach: 0,
        dailyImpressions: 0,
        isConstrained: channel.minPercent > 0 ? 'min' : 'none',
        score: scores.get(channel.channelId) || 0,
      };
    });

    // Step 2: Calculate remaining % to distribute
    let usedPercent = allocations.reduce((acc, a) => acc + a.percentage, 0);
    let remainingPercent = 100 - usedPercent;

    // Step 3: Distribute remaining proportionally by score
    const totalScore = allocations.reduce((acc, a) => acc + a.score, 0);

    while (remainingPercent > 0.01) {
      let distributed = 0;

      for (const alloc of allocations) {
        const channel = channels.find((c) => c.channelId === alloc.channelId)!;
        const maxAvailable = channel.maxPercent - alloc.percentage;

        if (maxAvailable <= 0) {
          alloc.isConstrained = 'max';
          continue;
        }

        // Proportional share based on score
        const share = totalScore > 0 ? (alloc.score / totalScore) * remainingPercent : remainingPercent / allocations.length;
        const toAdd = Math.min(share, maxAvailable);

        alloc.percentage += toAdd;
        distributed += toAdd;

        if (alloc.percentage >= channel.maxPercent - 0.01) {
          alloc.isConstrained = 'max';
        } else if (alloc.isConstrained === 'min' && alloc.percentage > channel.minPercent + 0.01) {
          alloc.isConstrained = 'none';
        }
      }

      remainingPercent -= distributed;

      // Safety: prevent infinite loop
      if (distributed < 0.01) break;
    }

    // Step 4: Normalize to exactly 100%
    const total = allocations.reduce((acc, a) => acc + a.percentage, 0);
    if (total > 0) {
      const factor = 100 / total;
      allocations.forEach((a) => {
        a.percentage = Math.round(a.percentage * factor * 100) / 100;
      });
    }

    // Step 5: Calculate budgets
    allocations.forEach((a) => {
      a.budget = Math.round((a.percentage / 100) * totalBudget * 100) / 100;
      a.dailyBudget = Math.round((a.budget / durationDays) * 100) / 100;
    });

    return allocations;
  }

  /**
   * Apply Video/Display slider bias
   */
  private applyVideoDisplayBias(
    allocations: ChannelAllocationResult[],
    channels: ChannelSettings[],
    bias: number
  ): ChannelAllocationResult[] {
    const videoAlloc = allocations.find((a) => a.channelId === 'video');
    const displayAlloc = allocations.find((a) => a.channelId === 'display');

    if (!videoAlloc || !displayAlloc) return allocations;

    const videoSettings = channels.find((c) => c.channelId === 'video');
    const displaySettings = channels.find((c) => c.channelId === 'display');

    if (!videoSettings || !displaySettings) return allocations;

    // Bias: positive = more video, negative = more display
    // Range: -50 to +50, translates to up to 25% shift
    const shift = (bias / 50) * 25; // Max 25% shift

    let newVideoPercent = videoAlloc.percentage + shift;
    let newDisplayPercent = displayAlloc.percentage - shift;

    // Clamp to min/max
    newVideoPercent = Math.max(
      videoSettings.minPercent,
      Math.min(videoSettings.maxPercent, newVideoPercent)
    );
    newDisplayPercent = Math.max(
      displaySettings.minPercent,
      Math.min(displaySettings.maxPercent, newDisplayPercent)
    );

    // Calculate actual shift after clamping
    const actualShift = newVideoPercent - videoAlloc.percentage;

    videoAlloc.percentage = newVideoPercent;
    displayAlloc.percentage = newDisplayPercent;

    // Recalculate budgets
    const totalBudget = allocations.reduce((acc, a) => acc + a.budget, 0);
    const durationDays = allocations[0].budget / allocations[0].dailyBudget;

    allocations.forEach((a) => {
      a.budget = Math.round((a.percentage / 100) * totalBudget * 100) / 100;
      a.dailyBudget = Math.round((a.budget / durationDays) * 100) / 100;
    });

    return allocations;
  }

  /**
   * Calculate impressions and reach for each allocation
   */
  private calculateMetrics(
    allocations: ChannelAllocationResult[],
    durationDays: number
  ): ChannelAllocationResult[] {
    allocations.forEach((alloc) => {
      // impressions = (budget / CPM) * 1000
      alloc.impressions = Math.round((alloc.budget / alloc.cpmUsed) * 1000);
      alloc.dailyImpressions = Math.round(alloc.impressions / durationDays);

      // reach = impressions / frequency
      alloc.reach = Math.round(alloc.impressions / alloc.frequencyUsed);
    });

    return allocations;
  }

  /**
   * Generate insights based on allocation results
   */
  private generateInsights(
    allocations: ChannelAllocationResult[],
    input: PlannerInput
  ): PlannerInsight[] {
    const insights: PlannerInsight[] = [];

    // Check for high concentration
    for (const alloc of allocations) {
      if (alloc.percentage > WARNING_THRESHOLDS.highConcentration) {
        const config = getChannelById(alloc.channelId);
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'High Concentration',
          message: `${config?.label} receives ${alloc.percentage.toFixed(0)}% of budget. Consider diversifying for better risk distribution.`,
        });
      }
    }

    // Check video allocation for engagement goal
    if (input.goal === 'engagement') {
      const videoAlloc = allocations.find((a) => a.channelId === 'video');
      if (videoAlloc && videoAlloc.percentage < WARNING_THRESHOLDS.lowVideoForEngagement) {
        insights.push({
          type: 'tip',
          icon: '💡',
          title: 'Engagement Opportunity',
          message: `Video is at ${videoAlloc.percentage.toFixed(0)}%. Consider increasing it for better engagement—video typically drives 2-3x more interaction.`,
        });
      }
    }

    // Check daily spend
    const dailyBudget = input.totalBudget / input.durationDays;
    if (dailyBudget < WARNING_THRESHOLDS.lowDailySpend) {
      insights.push({
        type: 'warning',
        icon: '💰',
        title: 'Low Daily Budget',
        message: `At $${dailyBudget.toFixed(0)}/day, you may not reach enough people daily. Consider a shorter campaign or higher budget.`,
      });
    }

    // Check constrained allocations
    const constrainedChannels = allocations.filter((a) => a.isConstrained !== 'none');
    if (constrainedChannels.length > 0) {
      const constrained = constrainedChannels
        .map((a) => {
          const config = getChannelById(a.channelId);
          return `${config?.label} (${a.isConstrained})`;
        })
        .join(', ');
      insights.push({
        type: 'info',
        icon: '🔒',
        title: 'Allocation Constrained',
        message: `Some channels hit their limits: ${constrained}. Adjust min/max in Advanced Options if needed.`,
      });
    }

    return insights;
  }

  /**
   * Build summary from allocations
   */
  private buildSummary(
    allocations: ChannelAllocationResult[],
    input: PlannerInput
  ): PlannerResult['summary'] {
    const totalImpressions = allocations.reduce((acc, a) => acc + a.impressions, 0);
    const totalReach = allocations.reduce((acc, a) => acc + a.reach, 0);
    const weightedCPM =
      allocations.reduce((acc, a) => acc + a.cpmUsed * (a.percentage / 100), 0);

    return {
      totalBudget: input.totalBudget,
      durationDays: input.durationDays,
      dailyBudget: Math.round((input.totalBudget / input.durationDays) * 100) / 100,
      totalImpressions,
      totalReach,
      averageCPM: Math.round(weightedCPM * 100) / 100,
      goal: input.goal,
    };
  }
}

