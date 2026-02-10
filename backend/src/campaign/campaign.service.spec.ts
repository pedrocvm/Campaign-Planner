import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { BudgetInputDto, CampaignGoal } from './dto/budget-input.dto';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignService],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateBudgetDistribution', () => {
    it('should return allocations for all three channels', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
        goal: CampaignGoal.BALANCED,
      };

      const result = service.calculateBudgetDistribution(input);

      expect(result.allocations).toHaveLength(3);
      expect(result.allocations.map(a => a.channel)).toEqual([
        'Video Ads',
        'Display Ads',
        'Social Ads',
      ]);
    });

    it('should allocate exactly 100% of budget', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
      };

      const result = service.calculateBudgetDistribution(input);

      const totalPercentage = result.allocations.reduce(
        (sum, a) => sum + a.percentage,
        0,
      );

      expect(Math.round(totalPercentage)).toBe(100);
    });

    it('should respect minimum channel percentage', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
        minChannelPercentage: 20,
      };

      const result = service.calculateBudgetDistribution(input);

      result.allocations.forEach(allocation => {
        expect(allocation.percentage).toBeGreaterThanOrEqual(19.9); // Allow small floating point error
      });
    });

    it('should respect maximum channel percentage', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
        maxChannelPercentage: 50,
      };

      const result = service.calculateBudgetDistribution(input);

      result.allocations.forEach(allocation => {
        expect(allocation.percentage).toBeLessThanOrEqual(50.1); // Allow small floating point error
      });
    });

    it('should prioritize social for reach goal', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
        goal: CampaignGoal.REACH,
      };

      const result = service.calculateBudgetDistribution(input);

      const socialAllocation = result.allocations.find(
        a => a.channel === 'Social Ads',
      );
      const videoAllocation = result.allocations.find(
        a => a.channel === 'Video Ads',
      );

      expect(socialAllocation!.percentage).toBeGreaterThan(
        videoAllocation!.percentage,
      );
    });

    it('should prioritize video for engagement goal', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
        goal: CampaignGoal.ENGAGEMENT,
      };

      const result = service.calculateBudgetDistribution(input);

      const videoAllocation = result.allocations.find(
        a => a.channel === 'Video Ads',
      );
      const displayAllocation = result.allocations.find(
        a => a.channel === 'Display Ads',
      );

      expect(videoAllocation!.percentage).toBeGreaterThan(
        displayAllocation!.percentage,
      );
    });

    it('should calculate correct impressions based on CPM', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
      };

      const result = service.calculateBudgetDistribution(input);

      result.allocations.forEach(allocation => {
        const expectedImpressions = (allocation.budget / allocation.cpm) * 1000;
        expect(allocation.estimatedImpressions).toBe(
          Math.round(expectedImpressions),
        );
      });
    });

    it('should include summary with correct total budget', () => {
      const input: BudgetInputDto = {
        totalBudget: 15000,
        durationDays: 45,
      };

      const result = service.calculateBudgetDistribution(input);

      expect(result.summary.totalBudget).toBe(15000);
      expect(result.summary.durationDays).toBe(45);
      expect(result.summary.dailyBudget).toBeCloseTo(15000 / 45, 2);
    });

    it('should include calculatedAt timestamp', () => {
      const input: BudgetInputDto = {
        totalBudget: 10000,
        durationDays: 30,
      };

      const result = service.calculateBudgetDistribution(input);

      expect(result.calculatedAt).toBeDefined();
      expect(new Date(result.calculatedAt).getTime()).not.toBeNaN();
    });
  });

  describe('getChannelInfo', () => {
    it('should return info for all channels', () => {
      const channels = service.getChannelInfo();

      expect(channels).toHaveLength(3);
      expect(channels.every(c => c.name && c.baseCpm && c.description)).toBe(
        true,
      );
    });

    it('should include strengths for each channel', () => {
      const channels = service.getChannelInfo();

      channels.forEach(channel => {
        expect(Array.isArray(channel.strengths)).toBe(true);
      });
    });
  });
});

