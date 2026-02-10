import { Injectable } from '@nestjs/common';
import { BudgetInputDto, CampaignGoal } from './dto/budget-input.dto';
import { BudgetResultDto, ChannelAllocationDto, BudgetSummaryDto } from './dto/budget-result.dto';

interface ChannelConfig {
  name: string;
  baseCpm: number;
  reachFactor: number;
  engagementWeight: number;
  reachWeight: number;
  description: string;
}

const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    name: 'Video Ads',
    baseCpm: 20,
    reachFactor: 0.65,
    engagementWeight: 9,
    reachWeight: 5,
    description: 'Premium video inventory with high engagement and brand impact',
  },
  {
    name: 'Display Ads',
    baseCpm: 7.5,
    reachFactor: 0.45,
    engagementWeight: 5,
    reachWeight: 7,
    description: 'Broad display network with balanced reach and targeting',
  },
  {
    name: 'Social Ads',
    baseCpm: 5,
    reachFactor: 0.55,
    engagementWeight: 6,
    reachWeight: 9,
    description: 'Social platforms with maximum reach and audience targeting',
  },
];

@Injectable()
export class CampaignService {
  
  calculateBudgetDistribution(input: BudgetInputDto): BudgetResultDto {
    const {
      totalBudget,
      durationDays,
      goal = CampaignGoal.BALANCED,
      minChannelPercentage = 10,
      maxChannelPercentage = 60,
    } = input;

    const channelScores = this.calculateChannelScores(goal);
    
    const totalScore = channelScores.reduce((sum, s) => sum + s.score, 0);
    const rawAllocations = channelScores.map(cs => ({
      ...cs,
      rawPercentage: (cs.score / totalScore) * 100,
    }));

    const constrainedAllocations = this.applyConstraints(
      rawAllocations,
      minChannelPercentage,
      maxChannelPercentage,
    );

    const channelAllocations = this.buildChannelAllocations(
      constrainedAllocations,
      totalBudget,
      durationDays,
    );

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

  private calculateChannelScores(goal: CampaignGoal): Array<{
    config: ChannelConfig;
    score: number;
  }> {
    return CHANNEL_CONFIGS.map(config => {
      let score: number;
      
      const costEfficiency = (1000 / config.baseCpm) * config.reachFactor;
      
      switch (goal) {
        case CampaignGoal.REACH:
          score = config.reachWeight * 2 + costEfficiency * 0.5;
          break;
        case CampaignGoal.ENGAGEMENT:
          score = config.engagementWeight * 2 + costEfficiency * 0.3;
          break;
        case CampaignGoal.BALANCED:
        default:
          score = (config.reachWeight + config.engagementWeight) * 0.5 + costEfficiency * 0.5;
          break;
      }
      
      return { config, score };
    });
  }

  private applyConstraints(
    allocations: Array<{ config: ChannelConfig; score: number; rawPercentage: number }>,
    minPct: number,
    maxPct: number,
  ): Array<{ config: ChannelConfig; percentage: number }> {
    let result = allocations.map(a => ({
      config: a.config,
      percentage: a.rawPercentage,
    }));

    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      let needsAdjustment = false;
      let deficit = 0;
      let surplus = 0;

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

  private buildChannelAllocations(
    allocations: Array<{ config: ChannelConfig; percentage: number }>,
    totalBudget: number,
    durationDays: number,
  ): ChannelAllocationDto[] {
    return allocations.map(({ config, percentage }) => {
      const budget = (totalBudget * percentage) / 100;
      const dailyBudget = budget / durationDays;
      
      const estimatedImpressions = Math.round((budget / config.baseCpm) * 1000);
      const dailyImpressions = Math.round(estimatedImpressions / durationDays);
      
      const estimatedReach = Math.round(estimatedImpressions * config.reachFactor);
      
      const efficiencyScore = Math.round(
        ((1000 / config.baseCpm) * config.reachFactor) / 10,
      );

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

  private generateCampaignRecommendation(
    totalBudget: number,
    durationDays: number,
    totalImpressions: number,
    goal: CampaignGoal,
  ): string {
    const dailyBudget = totalBudget / durationDays;
    const cpmEfficiency = totalBudget / (totalImpressions / 1000);

    let recommendation = '';

    if (dailyBudget < 100) {
      recommendation += 'Your daily budget is relatively low. Consider concentrating on fewer channels for better impact. ';
    } else if (dailyBudget > 1000) {
      recommendation += 'Strong daily budget allows for broad channel diversification. ';
    }

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
