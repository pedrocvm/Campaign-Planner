import { Module } from '@nestjs/common';
import { CampaignModule } from './campaign/campaign.module';

@Module({
  imports: [CampaignModule],
  controllers: [],
  providers: [],
})
export class AppModule {}


