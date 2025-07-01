import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('check')
  async checkCredits(
    @Request() req,
    @Body() body: { estimatedCredits: number },
  ) {
    const hasCredits = await this.creditsService.checkCredits(
      req.user.id,
      body.estimatedCredits,
    );
    return { hasCredits };
  }

  @Post('calculate')
  async calculateCredits(
    @Body() body: {
      modelId: string;
      inputTokens: number;
      outputTokens: number;
    },
  ) {
    const credits = this.creditsService.calculateCredits(
      body.modelId,
      body.inputTokens,
      body.outputTokens,
    );
    return { credits };
  }

  @Get('usage')
  async getUsageHistory(
    @Request() req,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const [usages, total] = await this.creditsService.getUserUsageHistory(
      req.user.id,
      limit,
      offset,
    );
    return {
      usages,
      total,
      limit,
      offset,
    };
  }

  @Get('stats')
  async getUsageStats(@Request() req) {
    return this.creditsService.getUserUsageStats(req.user.id);
  }
}