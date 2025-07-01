import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditUsage } from './entities/credit-usage.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

// Credit costs per 1k tokens for different models
const CREDIT_COSTS = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  'llama-3.1-70b': { input: 0, output: 0 }, // Free on Groq
  'llama-3.1-8b': { input: 0, output: 0 }, // Free on Groq
};

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditUsage)
    private creditUsageRepository: Repository<CreditUsage>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  calculateCredits(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const costs = CREDIT_COSTS[modelId] || { input: 1, output: 1 };
    const inputCredits = (inputTokens / 1000) * costs.input;
    const outputCredits = (outputTokens / 1000) * costs.output;
    return Number((inputCredits + outputCredits).toFixed(4));
  }

  async checkCredits(userId: string, estimatedCredits: number): Promise<boolean> {
    const remainingCredits = await this.subscriptionsService.getCreditsRemaining(userId);
    
    // Enterprise users have unlimited credits
    if (remainingCredits === -1) {
      return true;
    }

    return remainingCredits >= estimatedCredits;
  }

  async recordUsage(
    userId: string,
    modelId: string,
    provider: string,
    inputTokens: number,
    outputTokens: number,
    prompt?: string,
    response?: string,
    metadata?: Record<string, any>,
  ): Promise<CreditUsage> {
    const creditsUsed = this.calculateCredits(modelId, inputTokens, outputTokens);

    // Deduct credits from subscription
    await this.subscriptionsService.useCredits(userId, creditsUsed);

    const usage = this.creditUsageRepository.create({
      userId,
      modelId,
      provider,
      inputTokens,
      outputTokens,
      creditsUsed,
      prompt,
      response,
      metadata,
    });

    return this.creditUsageRepository.save(usage);
  }

  async getUserUsageHistory(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<[CreditUsage[], number]> {
    return this.creditUsageRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getUserUsageStats(userId: string): Promise<{
    totalCreditsUsed: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    usageByModel: Record<string, number>;
    usageByProvider: Record<string, number>;
  }> {
    const usages = await this.creditUsageRepository.find({
      where: { userId },
    });

    const stats = {
      totalCreditsUsed: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      usageByModel: {} as Record<string, number>,
      usageByProvider: {} as Record<string, number>,
    };

    for (const usage of usages) {
      stats.totalCreditsUsed += Number(usage.creditsUsed);
      stats.totalInputTokens += usage.inputTokens;
      stats.totalOutputTokens += usage.outputTokens;

      if (!stats.usageByModel[usage.modelId]) {
        stats.usageByModel[usage.modelId] = 0;
      }
      stats.usageByModel[usage.modelId] += Number(usage.creditsUsed);

      if (!stats.usageByProvider[usage.provider]) {
        stats.usageByProvider[usage.provider] = 0;
      }
      stats.usageByProvider[usage.provider] += Number(usage.creditsUsed);
    }

    return stats;
  }
}