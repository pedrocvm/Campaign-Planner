import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min, Max, IsOptional, IsEnum } from 'class-validator';

export enum CampaignGoal {
  REACH = 'reach',
  ENGAGEMENT = 'engagement',
  BALANCED = 'balanced',
}

export class BudgetInputDto {
  @ApiProperty({
    description: 'Total campaign budget in dollars',
    example: 10000,
    minimum: 100,
  })
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Minimum budget is $100' })
  totalBudget: number;

  @ApiProperty({
    description: 'Campaign duration in days',
    example: 30,
    minimum: 1,
    maximum: 365,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(365)
  durationDays: number;

  @ApiPropertyOptional({
    description: 'Campaign optimization goal',
    enum: CampaignGoal,
    default: CampaignGoal.BALANCED,
  })
  @IsOptional()
  @IsEnum(CampaignGoal)
  goal?: CampaignGoal = CampaignGoal.BALANCED;

  @ApiPropertyOptional({
    description: 'Minimum percentage to allocate per channel (0-33)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(33)
  minChannelPercentage?: number = 10;

  @ApiPropertyOptional({
    description: 'Maximum percentage to allocate per channel (34-100)',
    example: 60,
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(34)
  @Max(100)
  maxChannelPercentage?: number = 60;
}

