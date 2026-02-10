import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { BudgetInputDto } from './dto/budget-input.dto';
import { BudgetResultDto } from './dto/budget-result.dto';

@ApiTags('campaigns')
@Controller('api/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Calculate optimal budget distribution',
    description: 'Analyzes campaign parameters and returns optimal budget allocation across channels with expected reach metrics.',
  })
  @ApiBody({ type: BudgetInputDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Budget distribution calculated successfully',
    type: BudgetResultDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input parameters',
  })
  calculateDistribution(@Body() input: BudgetInputDto): BudgetResultDto {
    return this.campaignService.calculateBudgetDistribution(input);
  }

  @Get('channels')
  @ApiOperation({ 
    summary: 'Get available channel information',
    description: 'Returns information about available advertising channels including CPM and characteristics.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Channel information retrieved successfully',
  })
  getChannels() {
    return this.campaignService.getChannelInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'campaign-budget-api',
    };
  }
}


