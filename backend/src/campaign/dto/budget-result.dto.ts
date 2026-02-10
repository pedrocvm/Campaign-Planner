import { ApiProperty } from '@nestjs/swagger';

export class ChannelAllocationDto {
  @ApiProperty({ description: 'Channel name' })
  channel: string;

  @ApiProperty({ description: 'Allocated budget in dollars' })
  budget: number;

  @ApiProperty({ description: 'Percentage of total budget' })
  percentage: number;

  @ApiProperty({ description: 'Cost per thousand impressions (CPM)' })
  cpm: number;

  @ApiProperty({ description: 'Estimated impressions' })
  estimatedImpressions: number;

  @ApiProperty({ description: 'Estimated reach (unique users)' })
  estimatedReach: number;

  @ApiProperty({ description: 'Daily budget' })
  dailyBudget: number;

  @ApiProperty({ description: 'Daily impressions' })
  dailyImpressions: number;

  @ApiProperty({ description: 'Efficiency score (1-10)' })
  efficiencyScore: number;

  @ApiProperty({ description: 'Channel recommendation insight' })
  insight: string;
}

export class BudgetSummaryDto {
  @ApiProperty({ description: 'Total budget allocated' })
  totalBudget: number;

  @ApiProperty({ description: 'Campaign duration in days' })
  durationDays: number;

  @ApiProperty({ description: 'Total estimated impressions across all channels' })
  totalImpressions: number;

  @ApiProperty({ description: 'Total estimated reach (unique users)' })
  totalReach: number;

  @ApiProperty({ description: 'Average cost per thousand impressions' })
  averageCpm: number;

  @ApiProperty({ description: 'Daily total budget' })
  dailyBudget: number;

  @ApiProperty({ description: 'Optimization goal used' })
  goal: string;

  @ApiProperty({ description: 'Overall campaign recommendation' })
  recommendation: string;
}

export class BudgetResultDto {
  @ApiProperty({ 
    description: 'Allocation per channel',
    type: [ChannelAllocationDto],
  })
  allocations: ChannelAllocationDto[];

  @ApiProperty({ 
    description: 'Campaign summary',
    type: BudgetSummaryDto,
  })
  summary: BudgetSummaryDto;

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: string;
}

