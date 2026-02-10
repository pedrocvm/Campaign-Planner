import { Injectable } from '@nestjs/common';
import { BudgetInputDto, CampaignGoal } from './dto/budget-input.dto';
import { BudgetResultDto, ChannelAllocationDto, BudgetSummaryDto } from './dto/budget-result.dto';

/**
 * Channel configuration with market-based CPM values and characteristics.
 * 
 * CPM (Cost Per Mille) values are based on industry averages:
 * - Video: Premium inventory, higher engagement, $15-25 CPM
 * - Display: Standard inventory, broad reach, $5-10 CPM  
 * - Social: Volume-based, highest reach, $3-8 CPM
 * 
 * Reach factor: Percentage of impressions that translate to unique users
 * (accounts for frequency capping and user overlap)
 */
interface ChannelConfig {
  name: string;
  baseCpm: number;
  reachFactor: number; // How efficiently impressions convert to unique reach
  engagementWeight: number; // Relative engagement quality (1-10)
  reachWeight: number; // Relative reach efficiency (1-10)
  description: string;
}

const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    name: 'Video Ads',
    baseCpm: 20,
    reachFactor: 0.65, // Higher frequency, lower unique reach
    engagementWeight: 9,
    reachWeight: 5,
    description: 'Premium video inventory with high engagement and brand impact',
  },
  {
    name: 'Display Ads',
    baseCpm: 7.5,
    reachFactor: 0.45, // Medium overlap, moderate reach
    engagementWeight: 5,
    reachWeight: 7,
    description: 'Broad display network with balanced reach and targeting',
  },
  {
    name: 'Social Ads',
    baseCpm: 5,
    reachFactor: 0.55, // Good unique user identification
    engagementWeight: 6,
    reachWeight: 9,
    description: 'Social platforms with maximum reach and audience targeting',
  },
];

@Injectable()
export class CampaignService {
  
  /**
   * Calculates optimal budget distribution across advertising channels.
   * 
   * Algorithm overview:
   * 1. Calculate efficiency score for each channel based on goal
   * 2. Normalize scores to determine optimal percentages
   * 3. Apply min/max constraints
   * 4. Redistribute excess/deficit proportionally
   * 5. Calculate expected reach and impressions
   */
  calculateBudgetDistribution(input: BudgetInputDto): BudgetResultDto {
    const {
      totalBudget,
      durationDays,
      goal = CampaignGoal.BALANCED,
      minChannelPercentage = 10,
      maxChannelPercentage = 60,
    } = input;

    // Step 1: Calculate raw efficiency scores based on goal
    const channelScores = this.calculateChannelScores(goal);
    
    // Step 2: Normalize to percentages
    const totalScore = channelScores.reduce((sum, s) => sum + s.score, 0);
    const rawAllocations = channelScores.map(cs => ({
      ...cs,
      rawPercentage: (cs.score / totalScore) * 100,
    }));

    // Step 3 & 4: Apply constraints and redistribute
    const constrainedAllocations = this.applyConstraints(
      rawAllocations,
      minChannelPercentage,
      maxChannelPercentage,
    );

    // Step 5: Calculate final allocations with reach/impressions
    const channelAllocations = this.buildChannelAllocations(
      constrainedAllocations,
      totalBudget,
      durationDays,
    );

    // Build summary
    const summary = this.buildSummary(
      channelAllocations,
      totalBudget,
      durationDays,
      goal,
    );

    return {
      allocations: channelAllocations,
      summary,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate efficiency scores for each channel based on campaign goal.
   * 
   * For REACH: Prioritize channels with low CPM and high reach factor
   * For ENGAGEMENT: Prioritize channels with high engagement quality
   * For BALANCED: Use weighted average of both metrics
   */
  private calculateChannelScores(goal: CampaignGoal): Array<{
    config: ChannelConfig;
    score: number;
  }> {
    return CHANNEL_CONFIGS.map(config => {
      let score: number;
      
      // Base efficiency: impressions per dollar * reach factor
      const costEfficiency = (1000 / config.baseCpm) * config.reachFactor;
      
      switch (goal) {
        case CampaignGoal.REACH:
          // Maximize reach: weight heavily toward reach efficiency
          score = config.reachWeight * 2 + costEfficiency * 0.5;
          break;
        case CampaignGoal.ENGAGEMENT:
          // Maximize engagement: weight heavily toward engagement quality
          score = config.engagementWeight * 2 + costEfficiency * 0.3;
          break;
        case CampaignGoal.BALANCED:
        default:
          // Balanced: equal weight to reach, engagement, and cost
          score = (config.reachWeight + config.engagementWeight) * 0.5 + costEfficiency * 0.5;
          break;
      }
      
      return { config, score };
    });
  }

  /**
   * Apply min/max percentage constraints and redistribute budget.
   * Uses iterative redistribution to ensure constraints are met.
   */
  private applyConstraints(
    allocations: Array<{ config: ChannelConfig; score: number; rawPercentage: number }>,
    minPct: number,
    maxPct: number,
  ): Array<{ config: ChannelConfig; percentage: number }> {
    let result = allocations.map(a => ({
      config: a.config,
      percentage: a.rawPercentage,
    }));

    // Iteratively adjust until all constraints are met
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      let needsAdjustment = false;
      let deficit = 0;
      let surplus = 0;

      // Find items that need adjustment
      result = result.map(item => {
        if (item.percentage < minPct) {
          deficit += minPct - item.percentage;
          needsAdjustment = true;
          return { ...item, percentage: minPct };
        }
        if (item.percentage > maxPct) {
          surplus += item.percentage - maxPct;
          needsAdjustment = true;
          return { ...item, percentage: maxPct };
        }
        return item;
      });

      if (!needsAdjustment) break;

      // Redistribute surplus/deficit among flexible items
      const flexibleItems = result.filter(
        item => item.percentage > minPct && item.percentage < maxPct,
      );

      if (flexibleItems.length > 0) {
        const adjustment = (surplus - deficit) / flexibleItems.length;
        result = result.map(item => {
          if (item.percentage > minPct && item.percentage < maxPct) {
            return {
              ...item,
              percentage: Math.max(minPct, Math.min(maxPct, item.percentage + adjustment)),
            };
          }
          return item;
        });
      }

      iterations++;
    }

    // Normalize to exactly 100%
    const totalPct = result.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      const factor = 100 / totalPct;
      result = result.map(r => ({
        ...r,
        percentage: r.percentage * factor,
      }));
    }

    return result;
  }

  /**
   * Build detailed channel allocation objects with all metrics.
   */
  private buildChannelAllocations(
    allocations: Array<{ config: ChannelConfig; percentage: number }>,
    totalBudget: number,
    durationDays: number,
  ): ChannelAllocationDto[] {
    return allocations.map(({ config, percentage }) => {
      const budget = (totalBudget * percentage) / 100;
      const dailyBudget = budget / durationDays;
      
      // Impressions = (Budget / CPM) * 1000
      const estimatedImpressions = Math.round((budget / config.baseCpm) * 1000);
      const dailyImpressions = Math.round(estimatedImpressions / durationDays);
      
      // Reach = Impressions * Reach Factor (accounts for frequency)
      const estimatedReach = Math.round(estimatedImpressions * config.reachFactor);
      
      // Efficiency score combines cost efficiency and reach quality
      const efficiencyScore = Math.round(
        ((1000 / config.baseCpm) * config.reachFactor) / 10,
      );

      // Generate insight based on allocation
      const insight = this.generateChannelInsight(config, percentage, budget);

      return {
        channel: config.name,
        budget: Math.round(budget * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        cpm: config.baseCpm,
        estimatedImpressions,
        estimatedReach,
        dailyBudget: Math.round(dailyBudget * 100) / 100,
        dailyImpressions,
        efficiencyScore: Math.min(10, Math.max(1, efficiencyScore)),
        insight,
      };
    });
  }

  /**
   * Generate contextual insight for each channel allocation.
   */
  private generateChannelInsight(
    config: ChannelConfig,
    percentage: number,
    budget: number,
  ): string {
    if (percentage >= 40) {
      return `Strong focus on ${config.name}. ${config.description}. This is your primary channel.`;
    }
    if (percentage >= 25) {
      return `Significant investment in ${config.name}. Good balance with other channels.`;
    }
    if (percentage >= 15) {
      return `Moderate allocation to ${config.name}. Provides diversification to your campaign.`;
    }
    return `Minimal allocation to ${config.name}. Consider increasing if ${config.name.toLowerCase()} aligns with your audience.`;
  }

  /**
   * Build campaign summary with aggregate metrics and recommendations.
   */
  private buildSummary(
    allocations: ChannelAllocationDto[],
    totalBudget: number,
    durationDays: number,
    goal: CampaignGoal,
  ): BudgetSummaryDto {
    const totalImpressions = allocations.reduce(
      (sum, a) => sum + a.estimatedImpressions,
      0,
    );
    const totalReach = allocations.reduce(
      (sum, a) => sum + a.estimatedReach,
      0,
    );
    
    // Weighted average CPM
    const weightedCpm = allocations.reduce(
      (sum, a) => sum + (a.cpm * a.percentage / 100),
      0,
    );

    const recommendation = this.generateCampaignRecommendation(
      totalBudget,
      durationDays,
      totalImpressions,
      goal,
    );

    return {
      totalBudget,
      durationDays,
      totalImpressions,
      totalReach,
      averageCpm: Math.round(weightedCpm * 100) / 100,
      dailyBudget: Math.round((totalBudget / durationDays) * 100) / 100,
      goal,
      recommendation,
    };
  }

  /**
   * Generate overall campaign recommendation based on parameters.
   */
  private generateCampaignRecommendation(
    totalBudget: number,
    durationDays: number,
    totalImpressions: number,
    goal: CampaignGoal,
  ): string {
    const dailyBudget = totalBudget / durationDays;
    const cpmEfficiency = totalBudget / (totalImpressions / 1000);

    let recommendation = '';

    // Budget assessment
    if (dailyBudget < 100) {
      recommendation += 'Your daily budget is relatively low. Consider concentrating on fewer channels for better impact. ';
    } else if (dailyBudget > 1000) {
      recommendation += 'Strong daily budget allows for broad channel diversification. ';
    }

    // Goal-specific advice
    switch (goal) {
      case CampaignGoal.REACH:
        recommendation += 'Optimized for maximum reach - social and display channels are prioritized for broader audience exposure.';
        break;
      case CampaignGoal.ENGAGEMENT:
        recommendation += 'Optimized for engagement quality - video ads are prioritized for deeper audience connection.';
        break;
      case CampaignGoal.BALANCED:
        recommendation += 'Balanced distribution across channels provides both reach and engagement opportunities.';
        break;
    }

    return recommendation;
  }

  /**
   * Get available channel configurations for frontend display.
   */
  getChannelInfo(): Array<{
    name: string;
    baseCpm: number;
    description: string;
    strengths: string[];
  }> {
    return CHANNEL_CONFIGS.map(config => ({
      name: config.name,
      baseCpm: config.baseCpm,
      description: config.description,
      strengths: this.getChannelStrengths(config),
    }));
  }

  private getChannelStrengths(config: ChannelConfig): string[] {
    const strengths: string[] = [];
    
    if (config.engagementWeight >= 8) strengths.push('High Engagement');
    if (config.reachWeight >= 8) strengths.push('Maximum Reach');
    if (config.baseCpm <= 6) strengths.push('Cost Effective');
    if (config.reachFactor >= 0.6) strengths.push('Strong Unique Reach');
    if (config.baseCpm >= 15) strengths.push('Premium Inventory');
    
    return strengths;
  }
}

